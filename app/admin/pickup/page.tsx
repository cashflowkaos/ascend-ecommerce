import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  PackageCheck,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ensurePickupAvailability } from "@/lib/pickupAvailability";
import PickupSlotControls from "@/components/admin/PickupSlotControls";
import {
  togglePickupAvailability,
  togglePickupDay,
} from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default async function AdminPickupPage() {
  await ensurePickupAvailability();
  const slots = await prisma.pickupAvailability.findMany({
    where: {
      endsAt: {
        gte: new Date(),
      },
    },
    include: {
      bookedOrder: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  const openCount = slots.filter(
    (slot) =>
      slot.isActive &&
      !slot.bookedOrderId &&
      !slot.manualReservationName
  ).length;

  const bookedCount = slots.filter(
    (slot) =>
      Boolean(slot.bookedOrderId) ||
      Boolean(slot.manualReservationName)
  ).length;

  const disabledCount = slots.filter(
    (slot) =>
      !slot.isActive &&
      !slot.bookedOrderId &&
      !slot.manualReservationName
  ).length;

  const pacificDateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const groupedSlots = slots.reduce<
    Record<string, typeof slots>
  >((groups, slot) => {
    const key = pacificDateKey.format(slot.startsAt);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(slot);
    return groups;
  }, {});

  const pickupDays = Object.entries(groupedSlots);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <CalendarClock size={28} strokeWidth={1.7} />
          <div>
            <h1 className="text-2xl font-semibold">
              Pickup Availability
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Control the dates and times members can select for
              pickup.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <CheckCircle2 size={17} />
            Open Slots
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {openCount}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <PackageCheck size={17} />
            Booked
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {bookedCount}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <XCircle size={17} />
            Disabled
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {disabledCount}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <CalendarClock size={19} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Pickup Schedule
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Mon-Fri 10:00 AM - 10:00 PM | Sat-Sun 12:00 PM - 6:00 PM | 30-minute appointments
              </p>
            </div>
          </div>
        </div>

        {pickupDays.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-neutral-500">
            No upcoming pickup availability.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {pickupDays.map(([dateKey, daySlots]) => {
              const availableDayCount = daySlots.filter(
                (slot) =>
      slot.isActive &&
      !slot.bookedOrderId &&
      !slot.manualReservationName
              ).length;

              const bookedDayCount = daySlots.filter(
                (slot) =>
                  Boolean(slot.bookedOrderId) ||
                  Boolean(slot.manualReservationName)
              ).length;

              const disabledDayCount = daySlots.filter(
                (slot) =>
      !slot.isActive &&
      !slot.bookedOrderId &&
      !slot.manualReservationName
              ).length;

              const unbookedDayCount = daySlots.filter(
                (slot) =>
                  !slot.bookedOrderId &&
                  !slot.manualReservationName
              ).length;

              const wholeDayDisabled =
                unbookedDayCount > 0 &&
                availableDayCount === 0;

              const firstSlot = daySlots[0];
              const lastSlot = daySlots[daySlots.length - 1];

              const displaySlots = daySlots.filter((slot, index, allSlots) => {
                if (!slot.manualReservationGroupId) {
                  return true;
                }

                return (
                  allSlots.findIndex(
                    (candidate) =>
                      candidate.manualReservationGroupId ===
                      slot.manualReservationGroupId
                  ) === index
                );
              });

              const getDisplaySlotInfo = (slot: (typeof daySlots)[number]) => {
                if (!slot.manualReservationGroupId) {
                  return {
                    appointmentEndsAt: slot.endsAt,
                    blockedSlotCount: 1,
                  };
                }

                const groupedAppointmentSlots = daySlots
                  .filter(
                    (candidate) =>
                      candidate.manualReservationGroupId ===
                      slot.manualReservationGroupId
                  )
                  .sort(
                    (a, b) =>
                      a.startsAt.getTime() - b.startsAt.getTime()
                  );

                return {
                  appointmentEndsAt:
                    groupedAppointmentSlots[
                      groupedAppointmentSlots.length - 1
                    ]?.endsAt ?? slot.endsAt,
                  blockedSlotCount: groupedAppointmentSlots.length,
                };
              };

              const previewSlots = displaySlots.slice(0, 5);
              const remainingSlots = displaySlots.slice(5);

              return (
                <details key={dateKey} className="group">
                  <summary className="cursor-pointer list-none px-6 py-5 hover:bg-neutral-50">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="font-semibold">
                          {new Intl.DateTimeFormat("en-US", {
                            timeZone: "America/Los_Angeles",
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          }).format(firstSlot.startsAt)}
                        </div>

                        <div className="mt-1 text-sm text-neutral-500">
                          {formatTime(firstSlot.startsAt)} -{" "}
                          {formatTime(lastSlot.endsAt)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {availableDayCount > 0 ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            {availableDayCount} available
                          </span>
                        ) : (
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                            No availability
                          </span>
                        )}

                        {bookedDayCount > 0 && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {bookedDayCount} booked
                          </span>
                        )}

                        {disabledDayCount > 0 && (
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                            {disabledDayCount} disabled
                          </span>
                        )}

                        <span className="ml-2 text-sm font-medium text-neutral-600">
                          View Slots
                        </span>
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-neutral-200 bg-neutral-50/50 px-6 py-5">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {daySlots.length} total slots
                        </div>

                        <div className="mt-1 text-xs text-neutral-500">
                          Booked appointments are protected from availability changes.
                        </div>
                      </div>

                      <form action={togglePickupDay}>
                        <input
                          type="hidden"
                          name="date"
                          value={dateKey}
                        />

                        <input
                          type="hidden"
                          name="enable"
                          value={wholeDayDisabled ? "true" : "false"}
                        />

                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                        >
                          {wholeDayDisabled
                            ? "Enable Day"
                            : "Disable Day"}
                        </button>
                      </form>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {previewSlots.map((slot) => {
                        const isBooked = Boolean(slot.bookedOrderId);
                        const { appointmentEndsAt, blockedSlotCount } = getDisplaySlotInfo(slot);

                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {formatTime(slot.startsAt)} -{" "}
                                {formatTime(appointmentEndsAt)}
                              </div>

                            </div>

                            <PickupSlotControls
                              slotId={slot.id}
                              isActive={slot.isActive}
                              bookedOrderNumber={slot.bookedOrder?.orderNumber ?? null}
                              manualReservationName={slot.manualReservationName}
                              manualReservationPhone={slot.manualReservationPhone}
                              manualReservationNote={slot.manualReservationNote}
                              manualReservationType={slot.manualReservationType}
                              blockedSlotCount={blockedSlotCount}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {remainingSlots.length > 0 && (
                      <details className="mt-3 rounded-lg border border-neutral-200 bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                          View all {remainingSlots.length} more slots
                        </summary>

                        <div className="border-t border-neutral-200 p-3">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {remainingSlots.map((slot) => {
                              const isBooked = Boolean(slot.bookedOrderId);
                              const { appointmentEndsAt, blockedSlotCount } = getDisplaySlotInfo(slot);

                              return (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3"
                                >
                                  <div>
                                    <div className="text-sm font-medium">
                                      {formatTime(slot.startsAt)} -{" "}
                                      {formatTime(appointmentEndsAt)}
                                    </div>

                                  </div>

                                  <PickupSlotControls
                                    slotId={slot.id}
                                    isActive={slot.isActive}
                                    bookedOrderNumber={slot.bookedOrder?.orderNumber ?? null}
                                    manualReservationName={slot.manualReservationName}
                                    manualReservationPhone={slot.manualReservationPhone}
                                    manualReservationNote={slot.manualReservationNote}
                                    manualReservationType={slot.manualReservationType}
                                    blockedSlotCount={blockedSlotCount}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

