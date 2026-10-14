"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export default function BackOfficeSaveButton({
  idleLabel = "Save Customer",
}: {
  idleLabel?: string;
}) {
  const { pending } = useFormStatus();
  const submitted = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pending) {
      submitted.current = true;
      setSaved(false);
      return;
    }

    if (submitted.current) {
      submitted.current = false;
      setSaved(true);

      const timer = window.setTimeout(() => {
        setSaved(false);
      }, 1400);

      return () => window.clearTimeout(timer);
    }
  }, [pending]);

  return (
    <button
      type="submit"
      className="backoffice-primary-button"
      disabled={pending || saved}
      aria-live="polite"
      style={{
        opacity: pending || saved ? 0.6 : 1,
        cursor: pending || saved ? "default" : "pointer",
        minWidth: "135px",
      }}
    >
      {pending
        ? "Saving..."
        : saved
          ? "✓ Saved"
          : idleLabel}
    </button>
  );
}
