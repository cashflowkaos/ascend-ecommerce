"use client";

import { MessageSquare } from "lucide-react";
import { useFormStatus } from "react-dom";

type MessageSubmitButtonProps = {
  className: string;
};

export default function MessageSubmitButton({
  className,
}: MessageSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
    >
      <MessageSquare size={14} />
      {pending ? "Sending..." : "Send Reply"}
    </button>
  );
}
