"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeLegacyInvoice } from "@/app/backoffice/sales/actions";

type Props = {
  invoiceId: string;
  invoiceNumber: string;
};

export default function BackOfficeCompleteLegacyInvoiceForm({
  invoiceId,
  invoiceNumber,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    const confirmed = window.confirm(
      `Mark legacy invoice ${invoiceNumber} as completed?`
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await completeLegacyInvoice(invoiceId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to complete legacy invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="backoffice-panel">
      <div className="backoffice-panel-heading">
        <div>
          <span className="backoffice-eyebrow">
            LEGACY INVOICE
          </span>
          <h2>Complete Invoice</h2>
        </div>
      </div>

      <p>
        This legacy invoice is fully paid and can be marked
        completed. This does not affect inventory.
      </p>

      {error ? (
        <p style={{ color: "var(--danger, #b42318)" }}>
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="backoffice-primary-button"
        onClick={handleComplete}
        disabled={submitting}
      >
        {submitting ? "Completing..." : "Mark Completed"}
      </button>
    </div>
  );
}