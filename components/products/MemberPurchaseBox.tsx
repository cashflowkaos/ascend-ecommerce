"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart/cart";

type Variant = {
  id: string;
  strength: string;
  sku: string | null;
  memberPrice: number | null;
  inventoryQty: number;
  available: boolean;
};

type MemberPurchaseBoxProps = {
  productId: string;
  slug: string;
  productName: string;
  image: string | null;
  variants: Variant[];
};

export default function MemberPurchaseBox({
  productId,
  slug,
  productName,
  image,
  variants,
}: MemberPurchaseBoxProps) {
  const availableVariants = useMemo(
    () => variants.filter((variant) => variant.available),
    [variants]
  );

  const [variantId, setVariantId] = useState(
    availableVariants[0]?.id ?? ""
  );

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant =
    availableVariants.find(
      (variant) => variant.id === variantId
    ) ?? availableVariants[0] ?? null;

  if (availableVariants.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4A11E]">
          Member Pricing
        </p>

        <p className="mt-3 text-sm text-neutral-600">
          This compound is not currently available for purchase.
        </p>
      </div>
    );
  }

  const maxQuantity = Math.max(
    1,
    selectedVariant?.inventoryQty ?? 1
  );

  const safeQuantity = Math.min(
    quantity,
    maxQuantity
  );

  const subtotal =
    (selectedVariant?.memberPrice ?? 0) *
    safeQuantity;

  function handleAddToCart() {
    if (
      !selectedVariant ||
      selectedVariant.memberPrice === null
    ) {
      return;
    }

    addToCart({
      productId,
      variantId: selectedVariant.id,
      slug,
      productName,
      strength: selectedVariant.strength,
      sku: selectedVariant.sku,
      unitPrice: selectedVariant.memberPrice,
      quantity: safeQuantity,
      image,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4A11E]">
        Member Pricing
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            {productName}
          </p>

          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
            ${selectedVariant?.memberPrice?.toFixed(2)}
          </p>
        </div>

        {selectedVariant && (
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600">
            {selectedVariant.strength}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
            Strength
          </span>

          <select
            value={selectedVariant?.id ?? ""}
            onChange={(event) => {
              setVariantId(event.target.value);
              setQuantity(1);
              setAdded(false);
            }}
            className="h-12 rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-[#D4A11E]"
          >
            {availableVariants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
              >
                {variant.strength} — $
                {variant.memberPrice?.toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
            Quantity
          </span>

          <select
            value={safeQuantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setAdded(false);
            }}
            className="h-12 rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-[#D4A11E]"
          >
            {Array.from(
              { length: Math.min(maxQuantity, 10) },
              (_, index) => index + 1
            ).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-5">
        <span className="text-sm font-medium text-neutral-600">
          Subtotal
        </span>

        <strong className="text-xl text-neutral-950">
          ${subtotal.toFixed(2)}
        </strong>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold uppercase tracking-[0.16em] transition ${
          added
            ? "bg-[#D4A11E] text-black"
            : "bg-neutral-950 text-white hover:bg-[#D4A11E] hover:text-black"
        }`}
      >
        {added ? (
          <>
            <Check size={18} strokeWidth={2} />
            Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart size={18} strokeWidth={1.8} />
            Add to Cart
          </>
        )}
      </button>

      <div className="mt-4 text-center">
        <Link
          href="/cart"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 transition hover:text-[#D4A11E]"
        >
          View Cart
        </Link>
      </div>
    </div>
  );
}