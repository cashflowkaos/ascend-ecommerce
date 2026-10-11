"use client";

import { useFormStatus } from "react-dom";

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        border: "1px solid #b42318",
        background: "transparent",
        color: "#b42318",
        borderRadius: "8px",
        padding: "10px 14px",
        fontWeight: 700,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.55 : 1,
      }}
    >
      {pending ? "Deleting..." : "Delete Customer"}
    </button>
  );
}

export default function BackOfficeDeleteCustomerButton() {
  return (
    <div
      onClick={(event) => {
        const target = event.target as HTMLElement;

        if (target.closest('button[type="submit"]')) {
          const confirmed = window.confirm(
            "Delete this customer permanently? This cannot be undone."
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }
      }}
    >
      <DeleteSubmitButton />
    </div>
  );
}
