import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RequestedCartItem = {
  variantId?: unknown;
  quantity?: unknown;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (
    !user ||
    user.role !== "MEMBER" ||
    user.status !== "APPROVED" ||
    user.mustChangePassword
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray(
      (body as { items?: unknown }).items
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cart items are required.",
      },
      {
        status: 400,
      }
    );
  }

  const requestedItems = (
    body as {
      items: RequestedCartItem[];
    }
  ).items;

  const normalized = new Map<string, number>();

  for (const item of requestedItems) {
    if (
      !item ||
      typeof item.variantId !== "string"
    ) {
      continue;
    }

    const variantId = item.variantId.trim();
    const quantity = Number(item.quantity);

    if (
      !variantId ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      continue;
    }

    normalized.set(
      variantId,
      (normalized.get(variantId) ?? 0) +
        quantity
    );
  }

  if (normalized.size === 0) {
    return NextResponse.json({
      ok: true,
      items: [],
      totalUnits: 0,
      subtotal: 0,
      valid: false,
      errors: ["Your cart is empty."],
    });
  }

  const variantIds = Array.from(
    normalized.keys()
  );

  const variants =
    await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },
      select: {
        id: true,
        strength: true,
        sku: true,
        memberPrice: true,
        inventoryQty: true,
        active: true,
        purchasable: true,

        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            image: true,
            active: true,
            purchasable: true,
            trackInventory: true,
          },
        },
      },
    });

  const variantMap = new Map(
    variants.map((variant) => [
      variant.id,
      variant,
    ])
  );

  const validatedItems = [];
  const errors: string[] = [];

  for (const [
    variantId,
    quantity,
  ] of normalized.entries()) {
    const variant = variantMap.get(
      variantId
    );

    if (!variant) {
      errors.push(
        "A product in your cart is no longer available."
      );
      continue;
    }

    if (
      !variant.active ||
      !variant.product.active
    ) {
      errors.push(
        `${variant.product.name} ${variant.strength} is no longer active.`
      );
      continue;
    }

    if (
      !variant.purchasable ||
      !variant.product.purchasable
    ) {
      errors.push(
        `${variant.product.name} ${variant.strength} is not currently available for purchase.`
      );
      continue;
    }

    if (variant.memberPrice === null) {
      errors.push(
        `${variant.product.name} ${variant.strength} does not currently have member pricing.`
      );
      continue;
    }

    if (
      variant.product.trackInventory &&
      variant.inventoryQty < quantity
    ) {
      errors.push(
        `${variant.product.name} ${variant.strength} only has ${variant.inventoryQty} available.`
      );
      continue;
    }

    const unitPrice = Number(
      variant.memberPrice
    );

    const lineTotal =
      unitPrice * quantity;

    validatedItems.push({
      productId: variant.product.id,
      variantId: variant.id,
      slug: variant.product.slug,
      productName: variant.product.name,
      image: variant.product.image,
      strength: variant.strength,
      sku: variant.sku,
      quantity,
      unitPrice,
      lineTotal,
      inventoryQty: variant.inventoryQty,
      trackInventory:
        variant.product.trackInventory,
    });
  }

  const subtotal =
    validatedItems.reduce(
      (total, item) =>
        total + item.lineTotal,
      0
    );

  const totalUnits =
    validatedItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  return NextResponse.json({
    ok: true,
    items: validatedItems,
    totalUnits,
    subtotal,
    valid:
      errors.length === 0 &&
      validatedItems.length > 0,
    errors,
  });
}