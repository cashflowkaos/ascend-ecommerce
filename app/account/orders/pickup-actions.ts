"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { sendPickupTimeSelectedAdminEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function scheduleOrderPickup(
  formData: FormData
) {
  const user = await requireUser();

  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  const slotId = String(
    formData.get("slotId") ?? ""
  ).trim();

  if (!orderId || !slotId) {
    throw new Error(
      "Order and pickup time are required."
    );
  }

  const pickupResult = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        pickupScheduledAt: true,
        status: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot schedule pickup."
      );
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        "Payment must be confirmed before scheduling pickup."
      );
    }

    if (order.fulfillmentMethod !== "PICKUP") {
      throw new Error(
        "This order is not configured for pickup."
      );
    }

    if (order.pickupScheduledAt) {
      throw new Error(
        "Pickup has already been scheduled."
      );
    }

    const slot =
      await tx.pickupAvailability.findUnique({
        where: {
          id: slotId,
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          bookedOrderId: true,
        },
      });

    if (
      !slot ||
      !slot.isActive ||
      slot.bookedOrderId ||
      slot.startsAt <= new Date()
    ) {
      throw new Error(
        "That pickup time is no longer available."
      );
    }

    const claimed =
      await tx.pickupAvailability.updateMany({
        where: {
          id: slot.id,
          isActive: true,
          bookedOrderId: null,
        },
        data: {
          bookedOrderId: order.id,
        },
      });

    if (claimed.count !== 1) {
      throw new Error(
        "That pickup time was just booked. Please choose another time."
      );
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        pickupScheduledAt: slot.startsAt,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.user.email,
      customerFirstName: order.user.firstName,
      customerLastName: order.user.lastName,
      pickupScheduledAt: slot.startsAt,
    };
  });

  try {
    await sendPickupTimeSelectedAdminEmail({
      orderNumber: pickupResult.orderNumber,
      orderId: pickupResult.orderId,
      customerFirstName: pickupResult.customerFirstName,
      customerLastName: pickupResult.customerLastName,
      customerEmail: pickupResult.customerEmail,
      pickupScheduledAt: pickupResult.pickupScheduledAt,
    });
  } catch (error) {
    console.error(
      "Failed to send pickup time selected admin email:",
      error
    );
  }

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath("/admin/pickup");
  revalidatePath(`/admin/orders/${orderId}`);
}
