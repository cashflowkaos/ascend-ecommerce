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

  const retailIds: string[] = [];
  const distroIds: string[] = [];

  for (const id of normalized.keys()) {
    if (id.startsWith("distro:")) {
      const distroId = id.slice("distro:".length);

      if (distroId) {
        distroIds.push(distroId);
      }
    } else {
      retailIds.push(id);
    }
  }

  const variants =
    retailIds.length > 0
      ? await prisma.productVariant.findMany({
          where: {
            id: {
              in: retailIds,
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
        })
      : [];

  const variantMap = new Map(
    variants.map((variant) => [
      variant.id,
      variant,
    ])
  );

  const distroMember =
    distroIds.length > 0
      ? await prisma.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            distroEnabled: true,
            distroTier: true,
          },
        })
      : null;

  const distroProducts =
    distroIds.length > 0 &&
    distroMember?.distroEnabled &&
    distroMember.distroTier
      ? await prisma.distroProduct.findMany({
          where: {
            id: {
              in: distroIds,
            },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
            enabled: true,
            available: true,

            ...(distroMember.distroTier === "TIER_1"
              ? { tier1Price: true }
              : distroMember.distroTier === "TIER_2"
                ? { tier2Price: true }
                : { tier3Price: true }),
          },
        })
      : [];

  const distroMap = new Map(
    distroProducts.map((product) => [
      product.id,
      product,
    ])
  );

  const validatedItems = [];
  const errors: string[] = [];

  for (const [
    cartId,
    quantity,
  ] of normalized.entries()) {
    if (cartId.startsWith("distro:")) {
      const distroId = cartId.slice(
        "distro:".length
      );

      if (
        !distroMember?.distroEnabled ||
        !distroMember.distroTier
      ) {
        errors.push(
          "Your account does not currently have Distro access."
        );
        continue;
      }

      const product = distroMap.get(distroId);

      if (!product) {
        errors.push(
          "A Distro product in your cart is no longer available."
        );
        continue;
      }

      if (!product.enabled) {
        errors.push(
          `${product.name} is no longer active.`
        );
        continue;
      }

      if (!product.available) {
        errors.push(
          `${product.name} is currently out of stock.`
        );
        continue;
      }

      let distroPrice: unknown = null;

      if (
        distroMember.distroTier === "TIER_1" &&
        "tier1Price" in product
      ) {
        distroPrice = product.tier1Price;
      }

      if (
        distroMember.distroTier === "TIER_2" &&
        "tier2Price" in product
      ) {
        distroPrice = product.tier2Price;
      }

      if (
        distroMember.distroTier === "TIER_3" &&
        "tier3Price" in product
      ) {
        distroPrice = product.tier3Price;
      }

      if (distroPrice === null) {
        errors.push(
          `${product.name} does not currently have Distro pricing.`
        );
        continue;
      }

      const unitPrice = Number(distroPrice);

      if (!Number.isFinite(unitPrice)) {
        errors.push(
          `${product.name} has invalid Distro pricing.`
        );
        continue;
      }

      validatedItems.push({
        productId: product.id,
        variantId: cartId,
        slug: "distro",
        productName: product.name,
        image: null,
        strength: "Distro",
        sku: product.sku,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,

        // Distro inventory quantity is informational only.
        inventoryQty: null,
        trackInventory: false,
      });

      continue;
    }

    const variant = variantMap.get(cartId);

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

    if (!variant.purchasable) {
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