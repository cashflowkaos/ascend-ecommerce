"use server";

import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  sendOrderShippedEmail,
  sendPickupConfirmedEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

function orderIdFrom(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  return orderId;
}

function revalidateOrder(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/pickup");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function verifyZellePayment(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = orderIdFrom(formData);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        zelleConfirmation: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error("A cancelled order cannot be marked paid.");
    }

    if (order.status === "COMPLETED") {
      throw new Error("A completed order cannot be changed.");
    }

    if (order.paymentMethod !== "ZELLE") {
      throw new Error("This order is not a Zelle order.");
    }

    if (!order.zelleConfirmation?.trim()) {
      throw new Error(
        "This order does not have a Zelle confirmation number."
      );
    }

    if (order.paymentStatus === "PAID") {
      throw new Error(
        `Order ${order.orderNumber} is already paid.`
      );
    }

    const paidAt = new Date();

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paidAt,
        status:
          order.status === "PENDING"
            ? "PROCESSING"
            : order.status,
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "ZELLE_PAYMENT_VERIFIED",
        details: `Zelle payment verified. Confirmation: ${order.zelleConfirmation}`,
      },
    });
  });

  revalidateOrder(orderId);
}

export async function receiveCashAndCompletePickup(
  formData: FormData
) {
  const admin = await requireAdmin();
  const orderId = orderIdFrom(formData);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
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
        `Order ${order.orderNumber} is already complete.`
      );
    }

    if (order.paymentMethod !== "CASH") {
      throw new Error("This order is not a cash order.");
    }

    if (order.fulfillmentMethod !== "PICKUP") {
      throw new Error(
        "Cash payment is only supported for pickup orders."
      );
    }

    if (!order.pickupScheduledAt) {
      throw new Error(
        "This order does not have a pickup appointment."
      );
    }

    if (order.paymentStatus === "PAID") {
      throw new Error(
        "Cash payment has already been recorded."
      );
    }

    const now = new Date();

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paidAt: now,
        status: "COMPLETED",
        completedAt: now,
      },
    });

    await tx.orderActivity.create({
      data: {
        orderId: order.id,
        adminId: admin.id,
        action: "CASH_PICKUP_COMPLETED",
        details:
          "Cash payment received and pickup order completed.",
      },
    });
  });

  revalidateOrder(orderId);
  revalidatePath("/admin/orders/completed");
}
export async function confirmNewPickupDetails(
  formData: FormData
) {
  const admin = await requireAdmin();
  const orderId = orderIdFrom(formData);

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

  const confirmation = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
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

      if (
        order.status === "CANCELLED" ||
        order.status === "COMPLETED"
      ) {
        throw new Error(
          "This order can no longer be changed."
        );
      }

      if (order.fulfillmentMethod !== "PICKUP") {
        throw new Error(
          "This order is not configured for pickup."
        );
      }

      if (!order.pickupScheduledAt) {
        throw new Error(
          "This order does not have a pickup appointment."
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
          pickupAddress2: pickupAddress2 || null,
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
        pickupScheduledAt: order.pickupScheduledAt,
      };
    }
  );

  try {
    await sendPickupConfirmedEmail({
      email: confirmation.email,
      firstName: confirmation.firstName,
      orderNumber: confirmation.orderNumber,
      orderId: confirmation.orderId,
      pickupScheduledAt: confirmation.pickupScheduledAt,
      pickupAddress1,
      pickupAddress2: pickupAddress2 || null,
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

  revalidateOrder(orderId);
}

export async function completeNewPickupOrder(
  formData: FormData
) {
  const admin = await requireAdmin();
  const orderId = orderIdFrom(formData);

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
        "Payment must be received before completing pickup."
      );
    }

    if (order.fulfillmentMethod !== "PICKUP") {
      throw new Error("This is not a pickup order.");
    }

    if (!order.pickupScheduledAt) {
      throw new Error(
        "This order does not have a pickup appointment."
      );
    }

    await tx.order.update({
      where: { id: order.id },
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
          "Order handed to customer and pickup completed.",
      },
    });
  });

  revalidateOrder(orderId);
  revalidatePath("/admin/orders/completed");
}

export async function markNewOrderShipped(
  formData: FormData
) {
  const admin = await requireAdmin();
  const orderId = orderIdFrom(formData);

  const trackingNumber = String(
    formData.get("trackingNumber") ?? ""
  ).trim();

  if (!trackingNumber) {
    throw new Error(
      "A tracking number is required before shipping."
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentMethod: true,
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

      if (
        order.status === "CANCELLED" ||
        order.status === "COMPLETED"
      ) {
        throw new Error(
          "This order can no longer be shipped."
        );
      }

      if (order.paymentStatus !== "PAID") {
        throw new Error(
          "Payment must be verified before shipping."
        );
      }

      if (order.fulfillmentMethod !== "SHIPPING") {
        throw new Error("This is not a shipping order.");
      }

      if (order.shippedAt) {
        throw new Error(
          `Order ${order.orderNumber} has already been shipped.`
        );
      }

      const shippedAt = new Date();

      await tx.order.update({
        where: { id: order.id },
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
          details: `Order marked shipped. Tracking: ${trackingNumber}`,
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        email: order.user.email,
        firstName: order.user.firstName,
        trackingNumber,
      };
    }
  );

  try {
    await sendOrderShippedEmail({
      email: result.email,
      firstName: result.firstName,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      trackingNumber: result.trackingNumber,
    });
  } catch (error) {
    console.error(
      "Failed to send order shipped email:",
      error
    );
  }

  revalidateOrder(orderId);
}

export async function completeNewShippingOrder(
  formData: FormData
) {
  const admin = await requireAdmin();
  const orderId = orderIdFrom(formData);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
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
        "Payment must be verified before completing this order."
      );
    }

    if (order.fulfillmentMethod !== "SHIPPING") {
      throw new Error("This is not a shipping order.");
    }

    if (
      order.status !== "SHIPPED" ||
      !order.shippedAt ||
      !order.trackingNumber
    ) {
      throw new Error(
        "The order must be marked shipped before completion."
      );
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
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

  revalidateOrder(orderId);
  revalidatePath("/admin/orders/completed");
}
export async function deleteNewAdminOrder(
  formData: FormData
) {
  await requireAdmin();

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
  revalidatePath("/admin/pickup");
  revalidatePath("/account");
  revalidatePath("/account/orders");

  redirect("/admin/orders");
}
