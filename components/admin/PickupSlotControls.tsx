import {
  releasePickupReservation,
  reservePickupSlot,
  togglePickupAvailability,
} from "@/app/admin/pickup/actions";

type PickupSlotControlsProps = {
  slotId: string;
  isActive: boolean;
  bookedOrderNumber: string | null;
  manualReservationName: string | null;
  manualReservationPhone: string | null;
  manualReservationNote: string | null;
  manualReservationType: string | null;
  blockedSlotCount: number;
};

export default function PickupSlotControls({
  slotId,
  isActive,
  bookedOrderNumber,
  manualReservationName,
  manualReservationPhone,
  manualReservationNote,
  manualReservationType,
  blockedSlotCount,
}: PickupSlotControlsProps) {
  if (bookedOrderNumber) {
    return (
      <div className="mt-1">
        <span className="text-xs font-medium text-blue-700">
          Booked - {bookedOrderNumber}
        </span>
      </div>
    );
  }

  if (manualReservationName) {
    return (
      <div className="mt-2 space-y-2">
        <div>
          <div className="text-xs font-semibold text-amber-700">
            Booked - Manual
          </div>

          <div className="mt-0.5 text-xs font-medium text-neutral-700">
            {manualReservationName}
          </div>

          {manualReservationType && (
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">
              {manualReservationType === "DROP_OFF"
                ? "Drop Off"
                : "Pickup"}
              {blockedSlotCount > 1
                ? ` - ${blockedSlotCount} slots`
                : ""}
            </div>
          )}

          {manualReservationPhone && (
            <div className="mt-0.5 text-xs text-neutral-500">
              {manualReservationPhone}
            </div>
          )}

          {manualReservationNote && (
            <div className="mt-0.5 text-xs text-neutral-500">
              {manualReservationNote}
            </div>
          )}
        </div>

        <form action={releasePickupReservation}>
          <input
            type="hidden"
            name="slotId"
            value={slotId}
          />

          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50"
          >
            Release
          </button>
        </form>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="mt-2 space-y-2">
        <div className="text-xs font-medium text-neutral-500">
          Disabled
        </div>

        <form action={togglePickupAvailability}>
          <input
            type="hidden"
            name="slotId"
            value={slotId}
          />

          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50"
          >
            Enable
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="text-xs font-medium text-green-700">
        Available
      </div>

      <details className="rounded-md border border-neutral-200">
        <summary className="cursor-pointer list-none px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50">
          Book Manually
        </summary>

        <form
          action={reservePickupSlot}
          className="space-y-2 border-t border-neutral-200 p-2.5"
        >
          <input
            type="hidden"
            name="slotId"
            value={slotId}
          />

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Type
            </span>

            <select
              name="reservationType"
              defaultValue="PICKUP"
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-xs"
            >
              <option value="PICKUP">
                Pickup
              </option>
              <option value="DROP_OFF">
                Drop-off / Delivery
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Time Block
            </span>

            <select
              name="durationMinutes"
              defaultValue="30"
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-xs"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1 hour 30 minutes</option>
              <option value="120">2 hours</option>
            </select>

            <span className="mt-1 block text-[10px] leading-4 text-neutral-400">
              Drop-offs automatically block consecutive schedule slots.
            </span>
          </label>

          <input
            type="text"
            name="name"
            required
            maxLength={120}
            placeholder="Client name"
            className="w-full rounded-md border border-neutral-300 px-2.5 py-2 text-xs"
          />

          <input
            type="tel"
            name="phone"
            maxLength={40}
            placeholder="Phone (optional)"
            className="w-full rounded-md border border-neutral-300 px-2.5 py-2 text-xs"
          />

          <textarea
            name="note"
            maxLength={500}
            rows={2}
            placeholder="Note (optional)"
            className="w-full resize-none rounded-md border border-neutral-300 px-2.5 py-2 text-xs"
          />

          <button
            type="submit"
            className="w-full rounded-md bg-neutral-900 px-2.5 py-2 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Book Appointment
          </button>
        </form>
      </details>

      <form action={togglePickupAvailability}>
        <input
          type="hidden"
          name="slotId"
          value={slotId}
        />

        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50"
        >
          Disable
        </button>
      </form>
    </div>
  );
}
