"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { scheduleOrderPickup } from "./pickup-actions";

type PickupSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
};

type PickupDay = {
  dateKey: string;
  label: string;
  windowLabel: string;
  slots: PickupSlot[];
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function PickupTimeSelector({
  orderId,
  days,
}: {
  orderId: string;
  days: PickupDay[];
}) {
  const [openDay, setOpenDay] = useState(
    days[0]?.dateKey ?? ""
  );

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm leading-6 text-neutral-500">
        Select an available pickup appointment. All times are Pacific Time.
      </p>

      {days.map((day) => {
        const isOpen = openDay === day.dateKey;

        return (
          <div
            key={day.dateKey}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <button
              type="button"
              onClick={() =>
                setOpenDay(isOpen ? "" : day.dateKey)
              }
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-neutral-50"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-950">
                  {day.label}
                </span>

                <span className="mt-1 block text-xs text-neutral-500">
                  {day.windowLabel}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  {day.slots.length} available
                </span>

                <ChevronDown
                  size={18}
                  className={
                    isOpen
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-neutral-200 p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {day.slots.map((slot) => (
                    <form
                      key={slot.id}
                      action={scheduleOrderPickup}
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={orderId}
                      />

                      <input
                        type="hidden"
                        name="slotId"
                        value={slot.id}
                      />

                      <button
                        type="submit"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-900 transition hover:border-[#D4A11E] hover:bg-[#D4A11E]/5 hover:text-[#D4A11E]"
                      >
                        {formatTime(slot.startsAt)}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
