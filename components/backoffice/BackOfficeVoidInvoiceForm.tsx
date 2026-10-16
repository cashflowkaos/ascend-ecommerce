"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { voidInvoice } from "@/app/backoffice/sales/actions";

export default function BackOfficeVoidInvoiceForm({
  invoiceId,
  invoiceNumber,
  restoresInventory,
}: {
  invoiceId: string;
  invoiceNumber: string;
  restoresInventory: boolean;
}) {
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError("A void reason is required.");
      return;
    }

    const inventoryMessage = restoresInventory
      ? " The exact inventory allocated to this POS sale will be returned to its original batches and location."
      : "";

    const confirmed = window.confirm(
      `Void invoice ${invoiceNumber}?${inventoryMessage} This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await voidInvoice({
        invoiceId,
        reason: cleanReason,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="backoffice-panel backoffice-product-form"
    >
      <div className="backoffice-panel-heading">
        <div>
          <span className="backoffice-eyebrow">
            VOID INVOICE
          </span>
          <h2>Void {invoiceNumber}</h2>
        </div>
      </div>

      <div className="backoffice-form-grid">
        <label className="backoffice-form-field backoffice-form-field-wide">
          <span>Reason</span>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            rows={3}
            disabled={submitting}
            placeholder="Enter the reason for voiding this invoice..."
            required
          />

          <small>
            {restoresInventory
              ? "This POS invoice will remain in history and its exact allocated inventory will be returned."
              : "This invoice will remain permanently in invoice history."}
          </small>
        </label>
      </div>

      {error ? <p role="alert">{error}</p> : null}

      <div className="backoffice-form-actions">
        <button
          type="submit"
          className="backoffice-secondary-button"
          disabled={submitting}
        >
          {submitting ? "Voiding..." : "Void Invoice"}
        </button>
      </div>
    </form>
  );
}
