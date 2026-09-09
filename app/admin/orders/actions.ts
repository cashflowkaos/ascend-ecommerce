"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  sendOrderShippedEmail,
  sendPickupConfirmedEmail,
  sendPickupSchedulingRequiredEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function markOrderPaid(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  const paymentMethod = String(
    formData.get("paymentMethod") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (
    paymentMethod !== "CASH" &&
    paymentMethod !== "ZELLE"
  ) {
    throw new Error(
      "A valid payment method is required."
    );
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                productId: true,
                inventoryQty: true,
              },
            },

            product: {
              select: {
                trackInventory: true,
              },
            },
          },
        },

        orderActivities: {
          where: {
            action: "INVENTORY_CONFIRMED",
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot be marked paid."
      );
    }

    if (order.paymentStatus === "PAID") {
      throw new Error(
        `Order ${order.orderNumber} is already paid.`
      );
    }

    if (order.orderActivities.length === 0) {
      throw new Error(
        "Inventory must be confirmed before payment."
      );
    }

    for (const item of order.items) {
      if (!item.product?.trackInventory) {
        continue;
      }

      if (!item.variantId || !item.variant) {
        throw new Error(
          `${item.productName} ${item.strength} does not have a valid inventory variant.`
        );
      }

      const quantityBefore =
        item.variant.inventoryQty;

      const quantityAfter =
        quantityBefore - item.quantity;

      const updated =
        await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            inventoryQty: {
              gte: item.quantity,
            },
          },

          data: {
            inventoryQty: {
              decrement: item.quantity,
            },
          },
        });

      if (updated.count !== 1) {
        throw new Error(
          `Inventory changed before payment for ${item.productName} ${item.strength}.`
        );
      }

      await tx.inventoryMovement.create({
        data: {
          productId: item.variant.productId,
          variantId: item.variantId,
          type: "SOLD",

          quantity: -item.quantity,
          quantityBefore,
          quantityAfter,

          note:
            `Order ${order.orderNumber} paid via ${paymentMethod}`,
        },
      });
    }

    const paidAt = new Date();

    await tx.order.update({
      where: {
        id: order.id,
      },

      data: {
        paymentStatus: "PAID",
        paymentMethod,
        paidAt,
        status: "CONFIRMED",
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "PAYMENT_CONFIRMED",
        details: `Payment confirmed via ${paymentMethod}.`,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/compounds");
}
export async function deleteAdminOrder(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                productId: true,
                inventoryQty: true,
              },
            },

            product: {
              select: {
                trackInventory: true,
              },
            },
          },
        },

        pickupAvailability: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "COMPLETED") {
      throw new Error(
        "Completed orders cannot be deleted."
      );
    }

    if (order.paymentStatus === "PAID") {
      for (const item of order.items) {
        if (!item.product?.trackInventory) {
          continue;
        }

        if (!item.variantId || !item.variant) {
          throw new Error(
            `Cannot restore inventory for ${item.productName} ${item.strength}.`
          );
        }

        const currentVariant =
          await tx.productVariant.findUnique({
            where: {
              id: item.variantId,
            },
            select: {
              inventoryQty: true,
              productId: true,
            },
          });

        if (!currentVariant) {
          throw new Error(
            `Inventory variant no longer exists for ${item.productName} ${item.strength}.`
          );
        }

        const quantityBefore =
          currentVariant.inventoryQty;

        const quantityAfter =
          quantityBefore + item.quantity;

        await tx.productVariant.update({
          where: {
            id: item.variantId,
          },
          data: {
            inventoryQty: {
              increment: item.quantity,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: currentVariant.productId,
            variantId: item.variantId,
            type: "RETURNED",
            quantity: item.quantity,
            quantityBefore,
            quantityAfter,
            createdBy: admin.id,
            note:
              `Inventory restored from deleted order ${order.orderNumber}`,
          },
        });
      }
    }

    if (order.pickupAvailability) {
      await tx.pickupAvailability.update({
        where: {
          id: order.pickupAvailability.id,
        },
        data: {
          bookedOrderId: null,
        },
      });
    }

    await tx.order.delete({
      where: {
        id: order.id,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/completed");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/pickup");
  revalidatePath("/account");
  revalidatePath("/account/orders");
  revalidatePath("/compounds");

  redirect("/admin/orders");
}
export async function beginOrder(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "PENDING") {
      throw new Error(
        `Order ${order.orderNumber} has already been started.`
      );
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "ORDER_STARTED",
        details: "Order processing started.",
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function confirmOrderInventory(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "PROCESSING") {
      throw new Error(
        `Order ${order.orderNumber} is not ready for inventory confirmation.`
      );
    }

    const existingConfirmation =
      await tx.orderActivity.findFirst({
        where: {
          orderId: order.id,
          action: "INVENTORY_CONFIRMED",
        },
        select: { id: true },
      });

    if (existingConfirmation) {
      throw new Error(
        `Inventory has already been confirmed for order ${order.orderNumber}.`
      );
    }

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "INVENTORY_CONFIRMED",
        details: "Inventory availability confirmed.",
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function selectFulfillmentMethod(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  const fulfillmentMethod = String(
    formData.get("fulfillmentMethod") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (
    fulfillmentMethod !== "SHIPPING" &&
    fulfillmentMethod !== "PICKUP"
  ) {
    throw new Error(
      "A valid fulfillment method is required."
    );
  }

  const fulfillmentResult = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot enter fulfillment."
      );
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        "Payment must be confirmed before fulfillment."
      );
    }

    if (order.fulfillmentMethod) {
      throw new Error(
        `Fulfillment has already been selected for order ${order.orderNumber}.`
      );
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        fulfillmentMethod,
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "FULFILLMENT_SELECTED",
        details:
          fulfillmentMethod === "PICKUP"
            ? "Pickup selected. Waiting for member to schedule a pickup time."
            : "Shipping selected. Order is ready for shipping.",
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.user.email,
      firstName: order.user.firstName,
    };
  });

  if (fulfillmentMethod === "PICKUP") {
    try {
      await sendPickupSchedulingRequiredEmail({
        email: fulfillmentResult.email,
        firstName: fulfillmentResult.firstName,
        orderNumber: fulfillmentResult.orderNumber,
        orderId: fulfillmentResult.orderId,
      });
    } catch (error) {
      console.error(
        "Failed to send pickup scheduling email:",
        error
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}
export async function completePickupOrder(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        pickupScheduledAt: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot be completed."
      );
    }

    if (order.status === "COMPLETED") {
      throw new Error(
        "This order is already completed."
      );
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        "Payment must be confirmed first."
      );
    }

    if (order.fulfillmentMethod !== "PICKUP") {
      throw new Error(
        "This order is not a pickup order."
      );
    }

    if (!order.pickupScheduledAt) {
      throw new Error(
        "Pickup must be scheduled before completion."
      );
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "PICKUP_COMPLETED",
        details:
          "Order handed to member and pickup completed.",
      },
    });
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/pickup");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function confirmPickupDetails(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  const pickupAddress1 = String(
    formData.get("pickupAddress1") ?? ""
  ).trim();

  const pickupAddress2 = String(
    formData.get("pickupAddress2") ?? ""
  ).trim();

  const pickupCity = String(
    formData.get("pickupCity") ?? ""
  ).trim();

  const pickupState = String(
    formData.get("pickupState") ?? ""
  ).trim();

  const pickupPostalCode = String(
    formData.get("pickupPostalCode") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (
    !pickupAddress1 ||
    !pickupCity ||
    !pickupState ||
    !pickupPostalCode
  ) {
    throw new Error(
      "Pickup address, city, state, and ZIP code are required."
    );
  }

  const confirmation =
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentMethod: true,
          pickupScheduledAt: true,
          pickupConfirmedAt: true,

          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      if (order.status === "CANCELLED") {
        throw new Error(
          "Cancelled orders cannot be confirmed."
        );
      }

      if (order.status === "COMPLETED") {
        throw new Error(
          "Completed orders cannot be changed."
        );
      }

      if (order.paymentStatus !== "PAID") {
        throw new Error(
          "Payment must be confirmed before pickup."
        );
      }

      if (order.fulfillmentMethod !== "PICKUP") {
        throw new Error(
          "This order is not configured for pickup."
        );
      }

      if (!order.pickupScheduledAt) {
        throw new Error(
          "The member must select a pickup time first."
        );
      }

      if (order.pickupConfirmedAt) {
        throw new Error(
          "This pickup has already been confirmed."
        );
      }

      await tx.order.update({
        where: { id: order.id },

        data: {
          pickupAddress1,
          pickupAddress2:
            pickupAddress2 || null,
          pickupCity,
          pickupState,
          pickupPostalCode,
          pickupConfirmedAt: new Date(),
        },
      });

      await tx.orderActivity.create({
        data: {
          orderId: order.id,
          adminId: admin.id,
          action: "PICKUP_CONFIRMED",
          details:
            "Pickup appointment and location confirmed.",
        },
      });

      return {
        email: order.user.email,
        firstName: order.user.firstName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        pickupScheduledAt:
          order.pickupScheduledAt,
      };
    });

  try {
    await sendPickupConfirmedEmail({
      email: confirmation.email,
      firstName: confirmation.firstName,
      orderNumber: confirmation.orderNumber,
      orderId: confirmation.orderId,
      pickupScheduledAt:
        confirmation.pickupScheduledAt,
      pickupAddress1,
      pickupAddress2:
        pickupAddress2 || null,
      pickupCity,
      pickupState,
      pickupPostalCode,
    });
  } catch (error) {
    console.error(
      "Pickup confirmation email failed:",
      error
    );
  }

  revalidatePath(
    `/admin/orders/${orderId}`
  );
  revalidatePath("/admin/orders");
  revalidatePath("/admin/pickup");
  revalidatePath(
    `/account/orders/${orderId}`
  );
  revalidatePath("/account/orders");
}
export async function changeOrderPaymentMethod(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  const paymentMethod = String(
    formData.get("paymentMethod") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (
    paymentMethod !== "CASH" &&
    paymentMethod !== "ZELLE"
  ) {
    throw new Error(
      "A valid payment method is required."
    );
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot be changed."
      );
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        "Payment must already be confirmed."
      );
    }

    if (order.paymentMethod === paymentMethod) {
      throw new Error(
        `Payment method is already ${paymentMethod}.`
      );
    }

    const previousMethod =
      order.paymentMethod ?? "UNKNOWN";

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentMethod,
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "PAYMENT_METHOD_CHANGED",
        details:
          `Payment method changed from ${previousMethod} to ${paymentMethod}.`,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function markOrderShipped(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  const trackingNumber = String(
    formData.get("trackingNumber") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (!trackingNumber) {
    throw new Error(
      "A tracking number is required before shipping."
    );
  }

  const shippingResult = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },

      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        trackingNumber: true,
        shippedAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot be shipped."
      );
    }

    if (order.status === "COMPLETED") {
      throw new Error(
        "A completed order cannot be changed."
      );
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        "Payment must be confirmed before shipping."
      );
    }

    if (order.fulfillmentMethod !== "SHIPPING") {
      throw new Error(
        "This order is not configured for shipping."
      );
    }

    if (
      order.status === "SHIPPED" ||
      order.shippedAt
    ) {
      throw new Error(
        `Order ${order.orderNumber} has already been shipped.`
      );
    }

    const shippedAt = new Date();

    await tx.order.update({
      where: {
        id: order.id,
      },

      data: {
        trackingNumber,
        shippedAt,
        status: "SHIPPED",
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "ORDER_SHIPPED",
        details:
          `Order marked shipped. Tracking: ${trackingNumber}`,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.user.email,
      firstName: order.user.firstName,
      trackingNumber,
    };
  });

  try {
    await sendOrderShippedEmail({
      email: shippingResult.email,
      firstName: shippingResult.firstName,
      orderNumber: shippingResult.orderNumber,
      orderId: shippingResult.orderId,
      trackingNumber: shippingResult.trackingNumber,
    });
  } catch (error) {
    console.error(
      "Failed to send order shipped email:",
      error
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function completeShippingOrder(
  formData: FormData
) {
  const admin = await requireAdmin();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        trackingNumber: true,
        shippedAt: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot be completed."
      );
    }

    if (order.status === "COMPLETED") {
      throw new Error(
        `Order ${order.orderNumber} is already complete.`
      );
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        "Payment must be confirmed before completing this order."
      );
    }

    if (order.fulfillmentMethod !== "SHIPPING") {
      throw new Error(
        "This order is not configured for shipping."
      );
    }

    if (
      order.status !== "SHIPPED" ||
      !order.shippedAt ||
      !order.trackingNumber
    ) {
      throw new Error(
        "The order must be marked shipped before it can be completed."
      );
    }

    const completedAt = new Date();

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "COMPLETED",
        completedAt,
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "ORDER_COMPLETED",
        details: "Shipped order completed.",
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/completed");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}
