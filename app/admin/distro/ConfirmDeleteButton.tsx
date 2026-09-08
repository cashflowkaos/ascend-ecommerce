"use client";

type Props = {
  message?: string;
};

export default function ConfirmDeleteButton({
  message = "Are you sure you want to delete this Distro item? This cannot be undone.",
}: Props) {
  return (
    <button
      className="admin-delete-button"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
