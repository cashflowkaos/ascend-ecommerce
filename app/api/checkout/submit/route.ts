import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  sendNewOrderAdminEmail,
  sendNewOrderCustomerEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

type RequestedCartItem = {
  variantId?: unknown;
  quantity?: unknown;
};

type CheckoutBody = {
  items?: unknown;
  fulfillmentMethod?: unknown;
  paymentMethod?: unknown;
  zelleConfirmation?: unknown;
  pickupSlotId?: unknown;
};

type ValidatedOrderItem = {
  productId: string | null;
  variantId: string | null;
  productName: string;
  strength: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function createOrderNumber() {
  const date = new Date();

  const year = date
    .getFullYear()
    .toString()
    .slice(-2);

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const suffix = randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `ASC-${year}${month}${day}-${suffix}`;
}

function distroPrice(
  cost: number,
  tier: string
) {
  switch (tier) {
    case "TIER_1":
      return Math.ceil(cost * 1.4);

    case "TIER_2":
      return Math.ceil(cost * 1.35);

    case "TIER_3":
      return Math.ceil(cost * 1.3);

    default:
      return null;
  }
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

  let body: CheckoutBody;

  try {
    body =
      (await request.json()) as CheckoutBody;
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

  if (!Array.isArray(body.items)) {
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

  const fulfillmentMethod =
    body.fulfillmentMethod === "SHIPPING"
      ? "SHIPPING"
      : body.fulfillmentMethod === "PICKUP"
        ? "PICKUP"
        : null;

  if (!fulfillmentMethod) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Choose shipping or pickup.",
      },
      {
        status: 400,
      }
    );
  }

  const paymentMethod =
    body.paymentMethod === "ZELLE"
      ? "ZELLE"
      : body.paymentMethod === "CASH"
        ? "CASH"
        : null;

  if (!paymentMethod) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Choose a payment method.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    fulfillmentMethod === "SHIPPING" &&
    paymentMethod !== "ZELLE"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Shipping orders must be paid by Zelle.",
      },
      {
        status: 400,
      }
    );
  }

  const zelleConfirmation =
    typeof body.zelleConfirmation === "string"
      ? body.zelleConfirmation.trim()
      : "";

  if (
    paymentMethod === "ZELLE" &&
    !zelleConfirmation
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Zelle confirmation number is required.",
      },
      {
        status: 400,
      }
    );
  }

  if (zelleConfirmation.length > 120) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Zelle confirmation number is too long.",
      },
      {
        status: 400,
      }
    );
  }

  const pickupSlotId =
    typeof body.pickupSlotId === "string"
      ? body.pickupSlotId.trim()
      : "";

  if (
    fulfillmentMethod === "PICKUP" &&
    !pickupSlotId
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Choose a pickup date and time.",
      },
      {
        status: 400,
      }
    );
  }

  const requestedItems =
    body.items as RequestedCartItem[];

  const normalized =
    new Map<string, number>();

  for (const item of requestedItems) {
    if (
      !item ||
      typeof item.variantId !== "string"
    ) {
      continue;
    }

    const variantId =
      item.variantId.trim();

    const quantity =
      Number(item.quantity);

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

  const member =
    await prisma.user.findUnique({
      where: {
        id: user.id,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        distroEnabled: true,
        distroTier: true,

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
        error:
          "Member account was not found.",
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
          "Add an address to your account before placing an order.",
      },
      {
        status: 400,
      }
    );
  }

  const retailIds: string[] = [];
  const distroIds: string[] = [];

  for (const cartId of normalized.keys()) {
    if (cartId.startsWith("distro:")) {
      const distroId = cartId.slice(
        "distro:".length
      );

      if (distroId) {
        distroIds.push(distroId);
      }
    } else {
      retailIds.push(cartId);
    }
  }

  const orderChannel =
    retailIds.length > 0 &&
    distroIds.length > 0
      ? "MIXED"
      : distroIds.length > 0
        ? "DISTRO"
        : "RETAIL";

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
                name: true,
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

  const distroProducts =
    distroIds.length > 0 &&
    member.distroEnabled &&
    member.distroTier
      ? await prisma.distroProduct.findMany({
          where: {
            id: {
              in: distroIds,
            },
          },

          select: {
            id: true,
            enabled: true,
            available: true,

            backOfficeProduct: {
              select: {
                sku: true,
                name: true,
                cost: true,
                active: true,
              },
            },
          },
        })
      : [];

  const distroMap = new Map(
    distroProducts.map((product) => [
      product.id,
      product,
    ])
  );

  const validatedItems:
    ValidatedOrderItem[] = [];

  const errors: string[] = [];

  for (const [
    cartId,
    quantity,
  ] of normalized.entries()) {
    if (cartId.startsWith("distro:")) {
      if (
        !member.distroEnabled ||
        !member.distroTier
      ) {
        errors.push(
          "Your account does not currently have Distro access."
        );

        continue;
      }

      const distroId = cartId.slice(
        "distro:".length
      );

      const product =
        distroMap.get(distroId);

      if (!product) {
        errors.push(
          "A Distro product in your cart is no longer available."
        );

        continue;
      }

      const backOfficeProduct =
        product.backOfficeProduct;

      if (!backOfficeProduct) {
        errors.push(
          "A Distro product in your cart is no longer linked to the catalog."
        );

        continue;
      }

      if (
        !product.enabled ||
        !backOfficeProduct.active
      ) {
        errors.push(
          `${backOfficeProduct.name} is no longer active.`
        );

        continue;
      }

      if (!product.available) {
        errors.push(
          `${backOfficeProduct.name} is currently unavailable.`
        );

        continue;
      }

      if (backOfficeProduct.cost === null) {
        errors.push(
          `${backOfficeProduct.name} does not currently have Distro pricing.`
        );

        continue;
      }

      const unitPrice = distroPrice(
        Number(backOfficeProduct.cost),
        member.distroTier
      );

      if (
        unitPrice === null ||
        !Number.isFinite(unitPrice)
      ) {
        errors.push(
          `${backOfficeProduct.name} has invalid Distro pricing.`
        );

        continue;
      }

      validatedItems.push({
        productId: null,
        variantId: null,
        productName:
          backOfficeProduct.name,
        strength: "Distro",
        sku: backOfficeProduct.sku,
        quantity,
        unitPrice,
        lineTotal:
          unitPrice * quantity,
      });

      continue;
    }

    const variant =
      variantMap.get(cartId);

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
    const unitPrice =
      Number(variant.memberPrice);

    if (!Number.isFinite(unitPrice)) {
      errors.push(
        `${variant.product.name} ${variant.strength} has invalid pricing.`
      );

      continue;
    }

    validatedItems.push({
      productId: variant.product.id,
      variantId: variant.id,
      productName:
        variant.product.name,
      strength: variant.strength,
      sku: variant.sku,
      quantity,
      unitPrice,
      lineTotal:
        unitPrice * quantity,
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

  const subtotal =
    validatedItems.reduce(
      (total, item) =>
        total + item.lineTotal,
      0
    );

  const shippingAmount =
    fulfillmentMethod === "SHIPPING"
      ? 20
      : 0;

  const taxAmount = 0;

  const total =
    subtotal +
    shippingAmount +
    taxAmount;

  const paymentStatus =
    paymentMethod === "ZELLE"
      ? "PENDING"
      : "UNPAID";

  try {
    const order =
      await prisma.$transaction(
        async (tx) => {
          let pickupScheduledAt:
            | Date
            | null = null;

          if (
            fulfillmentMethod === "PICKUP"
          ) {
            const slot =
              await tx.pickupAvailability.findUnique({
                where: {
                  id: pickupSlotId,
                },

                select: {
                  id: true,
                  startsAt: true,
                  isActive: true,
                  bookedOrderId: true,
                  manualReservationName: true,
                },
              });

            const now = new Date();

            if (
              !slot ||
              !slot.isActive ||
              slot.bookedOrderId ||
              slot.manualReservationName ||
              slot.startsAt <= now
            ) {
              throw new Error(
                "PICKUP_SLOT_UNAVAILABLE"
              );
            }

            pickupScheduledAt =
              slot.startsAt;
          }

          let createdOrder:
            | {
                id: string;
                orderNumber: string;
              }
            | undefined;

          for (
            let attempt = 0;
            attempt < 3;
            attempt += 1
          ) {
            const orderNumber =
              createOrderNumber();

            try {
              createdOrder =
                await tx.order.create({
                  data: {
                    orderNumber,
                    userId: member.id,

                    status: "PENDING",
                    paymentStatus,
                    paymentMethod,
                    zelleConfirmation:
                      paymentMethod === "ZELLE"
                        ? zelleConfirmation
                        : null,
                    channel: orderChannel,

                    subtotal:
                      subtotal.toFixed(2),
                    shippingAmount:
                      shippingAmount.toFixed(2),
                    taxAmount:
                      taxAmount.toFixed(2),
                    total:
                      total.toFixed(2),

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

                    fulfillmentMethod,
                    pickupScheduledAt,

                    items: {
                      create:
                        validatedItems.map(
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
                              item.unitPrice.toFixed(
                                2
                              ),
                            lineTotal:
                              item.lineTotal.toFixed(
                                2
                              ),
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
                throw error;
              }
            }
          }

          if (!createdOrder) {
            throw new Error(
              "ORDER_CREATE_FAILED"
            );
          }

          if (
            fulfillmentMethod === "PICKUP"
          ) {
            const claimed =
              await tx.pickupAvailability.updateMany({
                where: {
                  id: pickupSlotId,
                  isActive: true,
                  bookedOrderId: null,
                  manualReservationName: null,
                  startsAt: {
                    gt: new Date(),
                  },
                },

                data: {
                  bookedOrderId:
                    createdOrder.id,
                },
              });

            if (claimed.count !== 1) {
              throw new Error(
                "PICKUP_SLOT_UNAVAILABLE"
              );
            }
          }

          return {
            ...createdOrder,
            pickupScheduledAt,
          };
        }
      );

    const emailDetails = {
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerEmail: member.email,
      customerFirstName: member.firstName,
      customerLastName: member.lastName,
      shipping: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        company: shipping.company,
        address1: shipping.address1,
        address2: shipping.address2,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone,
      },
      items: validatedItems,
      subtotal,
      shippingAmount,
      taxAmount,
      total,
      fulfillmentMethod,
      paymentMethod,
      zelleConfirmation:
        paymentMethod === "ZELLE"
          ? zelleConfirmation
          : null,
      pickupScheduledAt:
        order.pickupScheduledAt,
    };

    try {
      await sendNewOrderCustomerEmail({
        email: member.email,
        firstName: member.firstName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        shipping: emailDetails.shipping,
        items: validatedItems,
        subtotal,
        shippingAmount,
        taxAmount,
        total,
        fulfillmentMethod,
        paymentMethod,
        zelleConfirmation:
          emailDetails.zelleConfirmation,
        pickupScheduledAt:
          order.pickupScheduledAt,
      });
    } catch (emailError) {
      console.error(
        "Customer order confirmation email failed:",
        emailError
      );
    }

    try {
      await sendNewOrderAdminEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerEmail: member.email,
        customerFirstName: member.firstName,
        customerLastName: member.lastName,
        shipping: emailDetails.shipping,
        items: validatedItems,
        subtotal,
        shippingAmount,
        taxAmount,
        total,
        fulfillmentMethod,
        paymentMethod,
        zelleConfirmation:
          emailDetails.zelleConfirmation,
        pickupScheduledAt:
          order.pickupScheduledAt,
      });
    } catch (emailError) {
      console.error(
        "Admin new order notification email failed:",
        emailError
      );
    }
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      subtotal,
      shippingAmount,
      taxAmount,
      total,
      fulfillmentMethod,
      paymentMethod,
      paymentStatus,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "PICKUP_SLOT_UNAVAILABLE"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "That pickup time was just booked or is no longer available. Please choose another time.",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "Checkout order creation failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Your order could not be submitted. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}