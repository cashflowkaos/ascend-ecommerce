"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addInvoicePayment } from "@/app/backoffice/sales/actions";

export default function BackOfficeInvoicePaymentForm({
  invoiceId,
  balanceDue,
}: {
  invoiceId: string;
  balanceDue: number;
}) {
  const router = useRouter();

  const [method, setMethod] = useState<"CASH" | "ZELLE">(
    "CASH"
  );
  const [amount, setAmount] = useState(
    balanceDue.toFixed(2)
  );
  const [zelleReference, setZelleReference] =
    useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      setError("Enter a valid payment amount.");
      return;
    }

    if (paymentAmount > balanceDue) {
      setError(
        `Payment cannot exceed $${balanceDue.toFixed(2)}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await addInvoicePayment({
        invoiceId,
        method,
        amount: paymentAmount,
        zelleReference:
          method === "ZELLE" ? zelleReference : null,
        note,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess("Payment recorded.");
      setZelleReference("");
      setNote("");
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
            RECORD PAYMENT
          </span>
          <h2>Add Payment</h2>
        </div>
      </div>

      <div className="backoffice-form-grid">
        <label className="backoffice-form-field">
          <span>Method</span>

          <select
            value={method}
            onChange={(event) =>
              setMethod(
                event.target.value as "CASH" | "ZELLE"
              )
            }
            disabled={submitting}
          >
            <option value="CASH">Cash</option>
            <option value="ZELLE">Zelle</option>
          </select>
        </label>

        <label className="backoffice-form-field">
          <span>Amount</span>

          <input
            type="number"
            min="0.01"
            max={balanceDue}
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            disabled={submitting}
            required
          />
        </label>

        {method === "ZELLE" ? (
          <label className="backoffice-form-field">
            <span>Zelle Reference</span>

            <input
              type="text"
              value={zelleReference}
              onChange={(event) =>
                setZelleReference(event.target.value)
              }
              disabled={submitting}
              autoComplete="off"
            />
          </label>
        ) : null}

        <label className="backoffice-form-field backoffice-form-field-wide">
          <span>Note</span>

          <input
            type="text"
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            disabled={submitting}
            autoComplete="off"
          />
        </label>
      </div>

      {error ? (
        <p role="alert">{error}</p>
      ) : null}

      {success ? (
        <p>{success}</p>
      ) : null}

      <div className="backoffice-form-actions">
        <button
          type="submit"
          className="backoffice-primary-button"
          disabled={submitting}
        >
          {submitting ? "Recording..." : "Record Payment"}
        </button>
      </div>
    </form>
  );
}
