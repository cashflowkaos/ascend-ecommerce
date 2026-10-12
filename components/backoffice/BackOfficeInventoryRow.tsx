"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function BackOfficeInventoryRow({
  productId,
  children,
}: {
  productId: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function openProduct() {
    router.push(`/backoffice/inventory/${productId}`);
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openProduct();
        }
      }}
      style={{ cursor: "pointer" }}
    >
      {children}
    </tr>
  );
}