"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";
import { recordPhysicalInventoryCount } from "../actions";

type PhysicalCountFormProps = {
  batchId: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
};

type SaveState = {
  saved: boolean;
};

const initialState: SaveState = {
  saved: false,
};

export default function PhysicalCountForm({
  batchId,
  locationId,
  locationName,
  currentQuantity,
}: PhysicalCountFormProps) {
  const [note, setNote] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  async function saveCount(
    _previousState: SaveState,
    formData: FormData
  ): Promise<SaveState> {
    await recordPhysicalInventoryCount(formData);

    return {
      saved: true,
    };
  }

  const [state, formAction, pending] = useActionState(
    saveCount,
    initialState
  );

  useEffect(() => {
    if (!state.saved) {
      return;
    }

    setShowSaved(true);
    setNote("");

    const timer = window.setTimeout(() => {
      setShowSaved(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <form
      action={formAction}
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
          disabled={pending}
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
          disabled={pending}
        />
      </label>

      <button
        type="submit"
        disabled={pending || !note.trim()}
      >
        {pending
          ? "Saving..."
          : showSaved
            ? "✓ Saved"
            : "Save Count"}
      </button>
    </form>
  );
}