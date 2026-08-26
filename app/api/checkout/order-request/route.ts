import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  sendOrderRequestAdminEmail,
  sendOrderRequestCustomerEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

type RequestedCartItem = {
  variantId?: unknown;
  quantity?: unknown;
};

function createOrderNumber() {
  const date = new Date();

  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const suffix = randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `ASC-${year}${month}${day}-${suffix}`;
}

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
    return NextResponse.json(
      {
        ok: false,
        error: "Your cart is empty.",
      },
      {
        status: 400,
      }
    );
  }

  const member = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,

      addresses: {
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          firstName: true,
          lastName: true,
          company: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          isDefault: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json(
      {
        ok: false,
        error: "Member account was not found.",
      },
      {
        status: 404,
      }
    );
  }

  const shipping =
    member.addresses.find(
      (address) => address.isDefault
    ) ??
    member.addresses[0] ??
    null;

  if (!shipping) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Add a shipping address to your account before submitting an order request.",
      },
      {
        status: 400,
      }
    );
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
            name: true,
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

  const validatedItems: {
    productId: string;
    variantId: string;
    productName: string;
    strength: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];

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
      productName: variant.product.name,
      strength: variant.strength,
      sku: variant.sku,
      quantity,
      unitPrice,
      lineTotal,
    });
  }

  if (
    errors.length > 0 ||
    validatedItems.length === 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          errors[0] ??
          "Your order could not be validated.",
        errors,
      },
      {
        status: 409,
      }
    );
  }

  const subtotal = validatedItems.reduce(
    (total, item) =>
      total + item.lineTotal,
    0
  );

  // Temporary order-request checkout:
  // shipping and tax are currently zero.
  // These can later be replaced with real shipping/tax
  // calculation before online payment is enabled.
  const shippingAmount = 0;
  const taxAmount = 0;

  const total =
    subtotal +
    shippingAmount +
    taxAmount;

  let order:
    | {
        id: string;
        orderNumber: string;
      }
    | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = createOrderNumber();

    try {
      order = await prisma.order.create({
        data: {
          orderNumber,

          userId: member.id,

          status: "PENDING",
          paymentStatus: "UNPAID",

          subtotal: subtotal.toFixed(2),
          shippingAmount:
            shippingAmount.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),

          shippingFirstName:
            shipping.firstName,
          shippingLastName:
            shipping.lastName,
          shippingCompany:
            shipping.company,
          shippingAddress1:
            shipping.address1,
          shippingAddress2:
            shipping.address2,
          shippingCity:
            shipping.city,
          shippingState:
            shipping.state,
          shippingPostalCode:
            shipping.postalCode,
          shippingCountry:
            shipping.country,
          shippingPhone:
            shipping.phone,

          items: {
            create: validatedItems.map(
              (item) => ({
                productId:
                  item.productId,
                variantId:
                  item.variantId,
                productName:
                  item.productName,
                sku: item.sku,
                strength:
                  item.strength,
                quantity:
                  item.quantity,
                unitPrice:
                  item.unitPrice.toFixed(2),
                lineTotal:
                  item.lineTotal.toFixed(2),
              })
            ),
          },
        },

        select: {
          id: true,
          orderNumber: true,
        },
      });

      break;
    } catch (error) {
      if (attempt === 2) {
        console.error(
          "Order request creation failed:",
          error
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "Your order request could not be submitted. Please try again.",
          },
          {
            status: 500,
          }
        );
      }
    }
  }

  if (!order) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Your order request could not be submitted. Please try again.",
      },
      {
        status: 500,
      }
    );
  }

  const emailItems =
    validatedItems.map((item) => ({
      productName: item.productName,
      strength: item.strength,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

  // Email is deliberately secondary to the database order.
  // If email delivery fails, the order remains safely recorded.
  const emailResults =
    await Promise.allSettled([
      sendOrderRequestAdminEmail({
        orderNumber:
          order.orderNumber,
        customerEmail:
          member.email,
        customerFirstName:
          member.firstName,
        customerLastName:
          member.lastName,
        shipping: {
          firstName:
            shipping.firstName,
          lastName:
            shipping.lastName,
          company:
            shipping.company,
          address1:
            shipping.address1,
          address2:
            shipping.address2,
          city:
            shipping.city,
          state:
            shipping.state,
          postalCode:
            shipping.postalCode,
          country:
            shipping.country,
          phone:
            shipping.phone,
        },
        items: emailItems,
        subtotal,
        shippingAmount,
        taxAmount,
        total,
      }),

      sendOrderRequestCustomerEmail({
        email: member.email,
        firstName:
          member.firstName,
        orderNumber:
          order.orderNumber,
        items: emailItems,
        subtotal,
        shippingAmount,
        taxAmount,
        total,
      }),
    ]);

  for (const result of emailResults) {
    if (result.status === "rejected") {
      console.error(
        "Order request email failed:",
        result.reason
      );
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber:
      order.orderNumber,
    total,
  });
}