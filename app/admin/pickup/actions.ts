"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function togglePickupAvailability(
  formData: FormData
) {
  await requireAdmin();

  const slotId = String(
    formData.get("slotId") ?? ""
  ).trim();

  if (!slotId) {
    throw new Error("Pickup slot ID is required.");
  }

  const slot =
    await prisma.pickupAvailability.findUnique({
      where: {
        id: slotId,
      },
      select: {
        id: true,
        isActive: true,
        bookedOrderId: true,
      },
    });

  if (!slot) {
    throw new Error("Pickup slot not found.");
  }

  if (slot.bookedOrderId) {
    throw new Error(
      "A booked pickup slot cannot be disabled."
    );
  }

  await prisma.pickupAvailability.update({
    where: {
      id: slot.id,
    },
    data: {
      isActive: !slot.isActive,
    },
  });

  revalidatePath("/admin/pickup");
  revalidatePath("/account/orders");
}

export async function togglePickupDay(
  formData: FormData
) {
  await requireAdmin();

  const date = String(
    formData.get("date") ?? ""
  ).trim();

  const enable = String(
    formData.get("enable") ?? ""
  ) === "true";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Valid pickup date is required.");
  }

  const [year, month, day] = date.split("-").map(Number);

  // Use a deliberately broad UTC window, then verify each slot
  // against its Pacific calendar date before changing it.
  const rangeStart = new Date(
    Date.UTC(year, month - 1, day)
  );

  const rangeEnd = new Date(
    Date.UTC(year, month - 1, day + 2)
  );

  const slots = await prisma.pickupAvailability.findMany({
    where: {
      startsAt: {
        gte: rangeStart,
        lt: rangeEnd,
      },
      bookedOrderId: null,
    },
    select: {
      id: true,
      startsAt: true,
    },
  });

  const pacificFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const slotIds = slots
    .filter(
      (slot) => pacificFormatter.format(slot.startsAt) === date
    )
    .map((slot) => slot.id);

  if (slotIds.length > 0) {
    await prisma.pickupAvailability.updateMany({
      where: {
        id: {
          in: slotIds,
        },
        bookedOrderId: null,
      },
      data: {
        isActive: enable,
      },
    });
  }

  revalidatePath("/admin/pickup");
  revalidatePath("/account/orders");
}