"use client";

import { useState } from "react";
import { recordPhysicalInventoryCount } from "../actions";

type PhysicalCountFormProps = {
  batchId: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
};

export default function PhysicalCountForm({
  batchId,
  locationId,
  locationName,
  currentQuantity,
}: PhysicalCountFormProps) {
  const [note, setNote] = useState("");

  return (
    <form
      action={recordPhysicalInventoryCount}
      className="backoffice-count-form"
    >
      <input
        type="hidden"
        name="batchId"
        value={batchId}
      />

      <input
        type="hidden"
        name="locationId"
        value={locationId}
      />

      <label>
        <span>{locationName}</span>

        <input
          type="number"
          name="quantity"
          min="0"
          step="1"
          defaultValue={currentQuantity}
          required
        />
      </label>

      <label>
        <span>Count Note</span>

        <input
          type="text"
          name="note"
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          placeholder="Reason for count..."
          required
        />
      </label>

      <button
        type="submit"
        disabled={!note.trim()}
      >
        Save Count
      </button>
    </form>
  );
}
