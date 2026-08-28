"use client";

import { ReactNode } from "react";

type ConfirmDeleteProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  message: string;
};

export default function ConfirmDelete({
  action,
  children,
  message,
}: ConfirmDeleteProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
