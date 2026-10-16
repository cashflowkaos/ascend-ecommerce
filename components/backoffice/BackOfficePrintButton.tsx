"use client";

export default function BackOfficePrintButton() {
  return (
    <button
      type="button"
      className="backoffice-secondary-button invoice-print-button"
      onClick={() => window.print()}
    >
      Print / Save PDF
    </button>
  );
}