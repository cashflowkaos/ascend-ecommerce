"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function revalidatePickupPaths() {
  revalidatePath("/admin/pickup");
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

export async function togglePickupAvailability(
  formData: FormData
) {
  await requireAdmin();

  const slotId = clean(formData.get("slotId"));

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
        manualReservationName: true,
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

  if (slot.manualReservationName) {
    throw new Error(
      "A manually reserved pickup slot cannot be disabled."
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

  revalidatePickupPaths();
}

export async function reservePickupSlot(
  formData: FormData
) {
  await requireAdmin();

  const slotId = clean(formData.get("slotId"));
  const name = clean(formData.get("name"));
  const phone = clean(formData.get("phone"));
  const note = clean(formData.get("note"));
  const reservationType =
    clean(formData.get("reservationType")) === "DROP_OFF"
      ? "DROP_OFF"
      : "PICKUP";

  const requestedMinutes = Number(
    clean(formData.get("durationMinutes")) || "30"
  );

  if (!slotId) {
    throw new Error("Pickup slot ID is required.");
  }

  if (!name) {
    throw new Error("Client name is required.");
  }

  if (name.length > 120) {
    throw new Error("Client name is too long.");
  }

  if (phone.length > 40) {
    throw new Error("Phone number is too long.");
  }

  if (note.length > 500) {
    throw new Error("Reservation note is too long.");
  }

  const allowedDurations =
    reservationType === "DROP_OFF"
      ? [30, 60, 90, 120]
      : [30];

  if (!allowedDurations.includes(requestedMinutes)) {
    throw new Error("Invalid reservation duration.");
  }

  const requiredSlotCount = requestedMinutes / 30;
  const groupId = randomUUID();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const startSlot =
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
          manualReservationName: true,
        },
      });

    if (
      !startSlot ||
      !startSlot.isActive ||
      startSlot.bookedOrderId ||
      startSlot.manualReservationName ||
      startSlot.startsAt <= now
    ) {
      throw new Error(
        "That pickup time is no longer available."
      );
    }

    const expectedEnd = new Date(
      startSlot.startsAt.getTime() +
        requestedMinutes * 60 * 1000
    );

    const slots =
      await tx.pickupAvailability.findMany({
        where: {
          startsAt: {
            gte: startSlot.startsAt,
            lt: expectedEnd,
          },
        },
        orderBy: {
          startsAt: "asc",
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          bookedOrderId: true,
          manualReservationName: true,
        },
      });

    if (slots.length !== requiredSlotCount) {
      throw new Error(
        "There are not enough consecutive pickup slots available."
      );
    }

    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];

      const expectedStart = new Date(
        startSlot.startsAt.getTime() +
          index * 30 * 60 * 1000
      );

      if (
        slot.startsAt.getTime() !== expectedStart.getTime() ||
        !slot.isActive ||
        slot.bookedOrderId ||
        slot.manualReservationName ||
        slot.startsAt <= now
      ) {
        throw new Error(
          "One or more required pickup slots are no longer available."
        );
      }
    }

    const claimed =
      await tx.pickupAvailability.updateMany({
        where: {
          id: {
            in: slots.map((slot) => slot.id),
          },
          isActive: true,
          bookedOrderId: null,
          manualReservationName: null,
        },
        data: {
          manualReservationName: name,
          manualReservationPhone: phone || null,
          manualReservationNote: note || null,
          manualReservationType: reservationType,
          manualReservationGroupId: groupId,
        },
      });

    if (claimed.count !== requiredSlotCount) {
      throw new Error(
        "One or more required pickup slots were just booked."
      );
    }
  });

  revalidatePickupPaths();
}

export async function releasePickupReservation(
  formData: FormData
) {
  await requireAdmin();

  const slotId = clean(formData.get("slotId"));

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
        bookedOrderId: true,
        manualReservationName: true,
        manualReservationGroupId: true,
      },
    });

  if (
    !slot ||
    slot.bookedOrderId ||
    !slot.manualReservationName
  ) {
    throw new Error(
      "Manual pickup reservation was not found."
    );
  }

  if (slot.manualReservationGroupId) {
    await prisma.pickupAvailability.updateMany({
      where: {
        manualReservationGroupId:
          slot.manualReservationGroupId,
        bookedOrderId: null,
      },
      data: {
        manualReservationName: null,
        manualReservationPhone: null,
        manualReservationNote: null,
        manualReservationType: null,
        manualReservationGroupId: null,
      },
    });
  } else {
    await prisma.pickupAvailability.update({
      where: {
        id: slot.id,
      },
      data: {
        manualReservationName: null,
        manualReservationPhone: null,
        manualReservationNote: null,
        manualReservationType: null,
        manualReservationGroupId: null,
      },
    });
  }

  revalidatePickupPaths();
}

export async function togglePickupDay(
  formData: FormData
) {
  await requireAdmin();

  const date = clean(formData.get("date"));

  const enable =
    clean(formData.get("enable")) === "true";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Valid pickup date is required.");
  }

  const [year, month, day] = date.split("-").map(Number);

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
      manualReservationName: null,
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
      (slot) =>
        pacificFormatter.format(slot.startsAt) === date
    )
    .map((slot) => slot.id);

  if (slotIds.length > 0) {
    await prisma.pickupAvailability.updateMany({
      where: {
        id: {
          in: slotIds,
        },
        bookedOrderId: null,
        manualReservationName: null,
      },
      data: {
        isActive: enable,
      },
    });
  }

  revalidatePickupPaths();
}
