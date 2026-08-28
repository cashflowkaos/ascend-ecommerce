"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  CART_CHANGED_EVENT,
  clearCart,
  getCart,
  removeFromCart,
  setCartQuantity,
} from "@/lib/cart/cart";

type ValidatedItem = {
  productId: string;
  variantId: string;
  slug: string;
  productName: string;
  image: string | null;
  strength: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  inventoryQty: number;
  trackInventory: boolean;
};

type OrderRequestResponse = {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
  errors?: string[];
};

type ValidationResponse = {
  ok: boolean;
  items?: ValidatedItem[];
  totalUnits?: number;
  subtotal?: number;
  valid?: boolean;
  errors?: string[];
  error?: string;
};

export default function CheckoutOrderSummary() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [valid, setValid] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const shipping = 0;
  const total = subtotal + shipping;

  async function validateCart() {
    setLoading(true);

    try {
      const cart = getCart();

      const requestItems = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const response = await fetch(
        "/api/checkout/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: requestItems,
          }),
        }
      );

      const data =
        (await response.json()) as ValidationResponse;

      if (!response.ok || !data.ok) {
        setItems([]);
        setTotalUnits(0);
        setSubtotal(0);
        setValid(false);
        setErrors([
          data.error ??
            "Your cart could not be validated.",
        ]);
        return;
      }

      setItems(data.items ?? []);
      setTotalUnits(data.totalUnits ?? 0);
      setSubtotal(data.subtotal ?? 0);
      setValid(data.valid ?? false);
      setErrors(data.errors ?? []);
    } catch {
      setItems([]);
      setTotalUnits(0);
      setSubtotal(0);
      setValid(false);
      setErrors([
        "Your cart could not be validated. Please try again.",
      ]);
    } finally {
      setLoading(false);
    }
  }

  function changeQuantity(
    item: ValidatedItem,
    quantity: number
  ) {
    if (submitting) {
      return;
    }

    const nextQuantity = Math.max(
      0,
      Math.floor(quantity)
    );

    if (
      item.trackInventory &&
      nextQuantity > item.inventoryQty
    ) {
      return;
    }

    setCartQuantity(
      item.variantId,
      nextQuantity
    );
  }

  function removeItem(variantId: string) {
    if (submitting) {
      return;
    }

    removeFromCart(variantId);
  }
  async function submitOrderRequest() {
    if (submitting || !valid || items.length === 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const cart = getCart();

      const requestItems = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      if (requestItems.length === 0) {
        setSubmitError(
          "Your cart is empty."
        );
        setSubmitting(false);
        return;
      }

      const response = await fetch(
        "/api/checkout/order-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: requestItems,
          }),
        }
      );

      const data =
        (await response.json()) as OrderRequestResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.orderNumber
      ) {
        setSubmitError(
          data.error ??
            "Your order request could not be submitted. Please try again."
        );

        setSubmitting(false);
        return;
      }

      const orderNumber = data.orderNumber;

      clearCart();

      router.push(
        `/checkout/success?order=${encodeURIComponent(
          orderNumber
        )}`
      );
    } catch {
      setSubmitError(
        "Your order request could not be submitted. Please try again."
      );

      setSubmitting(false);
    }
  }

  useEffect(() => {
    validateCart();

    window.addEventListener(
      CART_CHANGED_EVENT,
      validateCart
    );

    window.addEventListener(
      "storage",
      validateCart
    );

    return () => {
      window.removeEventListener(
        CART_CHANGED_EVENT,
        validateCart
      );

      window.removeEventListener(
        "storage",
        validateCart
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 flex min-h-40 items-center justify-center rounded-[16px] border border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Validating order...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="mt-6 rounded-[16px] border border-neutral-200 bg-neutral-50 p-5 text-center">
          <ShoppingBag
            size={25}
            strokeWidth={1.5}
            className="mx-auto text-neutral-300"
          />

          <p className="mt-3 text-sm font-medium text-neutral-900">
            Your cart is empty
          </p>

          <Link
            href="/compounds"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-neutral-950 px-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#D4A11E] hover:text-black"
          >
            Browse Compounds
          </Link>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
            {errors.map((error) => (
              <p
                key={error}
                className="text-xs leading-5 text-amber-800"
              >
                {error}
              </p>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled
          className="mt-6 flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-200 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500"
        >
          Pay
        </button>
      </>
    );
  }

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-[16px] border border-neutral-200">
        {items.map((item, index) => {
          const atInventoryLimit =
            item.trackInventory &&
            item.quantity >= item.inventoryQty;

          return (
            <div
              key={item.variantId}
              className={`p-4 ${
                index !== items.length - 1
                  ? "border-b border-neutral-200"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/compound/${item.slug}`}
                    className="text-sm font-semibold text-neutral-950 transition hover:text-[#D4A11E]"
                  >
                    {item.productName}
                  </Link>

                  <p className="mt-1 text-xs font-medium text-neutral-500">
                    {item.strength}
                  </p>

                  <p className="mt-1 text-[11px] text-neutral-400">
                    ${item.unitPrice.toFixed(2)} each
                  </p>
                </div>

                <strong className="shrink-0 text-sm">
                  ${item.lineTotal.toFixed(2)}
                </strong>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 items-center overflow-hidden rounded-full border border-neutral-300 bg-white">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        changeQuantity(
                          item,
                          item.quantity - 1
                        )
                      }
                      aria-label={`Decrease ${item.productName} quantity`}
                      className="flex h-full w-10 items-center justify-center transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus
                        size={14}
                        strokeWidth={1.8}
                      />
                    </button>

                    <span className="flex min-w-9 items-center justify-center text-sm font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      disabled={
                        submitting ||
                        atInventoryLimit
                      }
                      onClick={() =>
                        changeQuantity(
                          item,
                          item.quantity + 1
                        )
                      }
                      aria-label={`Increase ${item.productName} quantity`}
                      className="flex h-full w-10 items-center justify-center transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Plus
                        size={14}
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      removeItem(item.variantId)
                    }
                    className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-medium text-neutral-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2
                      size={14}
                      strokeWidth={1.7}
                    />
                    Remove
                  </button>
                </div>

                {item.trackInventory && (
                  <span className="text-[10px] text-neutral-400">
                    {item.inventoryQty} available
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div className="space-y-1">
              {errors.map((error) => (
                <p
                  key={error}
                  className="text-xs leading-5 text-amber-800"
                >
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-neutral-500">
            Items
          </span>

          <span className="font-medium">
            {totalUnits}
          </span>
        </div>

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-neutral-500">
            Subtotal
          </span>

          <span className="font-medium">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-neutral-500">
            Standard Shipping
          </span>

          <span className="text-right text-xs font-medium text-neutral-500">
            Confirmed After Submission
          </span>
        </div>

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-neutral-500">
            Tax
          </span>

          <span className="text-right text-xs font-medium text-neutral-500">
            Not collected online
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="font-medium">
              Estimated Order Total
            </span>

            <p className="mt-1 text-[11px] text-neutral-400">
              Payment is not collected online
            </p>
          </div>

          <strong className="text-2xl">
            ${total.toFixed(2)}
          </strong>
        </div>
      </div>

      {submitError && (
        <div className="mt-5 rounded-[16px] border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <p className="text-xs leading-5 text-red-800">
              {submitError}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!valid || submitting}
        onClick={submitOrderRequest}
        className={`mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.16em] transition ${
          valid && !submitting
            ? "bg-[#D4A11E] text-white hover:bg-[#b98b17]"
            : "cursor-not-allowed bg-neutral-200 text-neutral-500"
        }`}
      >
        {submitting ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />
            Submitting Order Request...
          </>
        ) : (
          <>
            Submit Order Request — ${total.toFixed(2)}
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs leading-5 text-neutral-500">
        No payment will be collected when you submit this request.
        An Ascend representative will contact you regarding payment
        and fulfillment.
      </p>

      <p className="mt-1 text-center text-[11px] leading-5 text-neutral-400">
        Prices and availability verified from current inventory.
      </p>
    </>
  );
}
