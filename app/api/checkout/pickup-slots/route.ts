import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePickupAvailability } from "@/lib/pickupAvailability";

export async function GET() {
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

  await ensurePickupAvailability();

  const now = new Date();

  const slots =
    await prisma.pickupAvailability.findMany({
      where: {
        isActive: true,
        bookedOrderId: null,
        manualReservationName: null,
        startsAt: {
          gt: now,
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    });

  return NextResponse.json({
    ok: true,
    slots: slots.map((slot) => ({
      id: slot.id,
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
    })),
  });
}