"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  CART_CHANGED_EVENT,
  type CartItem,
  getCart,
  removeFromCart,
  setCartQuantity,
} from "@/lib/cart/cart";

export default function MemberCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  function refreshCart() {
    setItems(getCart());
  }

  useEffect(() => {
    refreshCart();
    setLoaded(true);

    window.addEventListener(
      CART_CHANGED_EVENT,
      refreshCart
    );

    window.addEventListener(
      "storage",
      refreshCart
    );

    return () => {
      window.removeEventListener(
        CART_CHANGED_EVENT,
        refreshCart
      );

      window.removeEventListener(
        "storage",
        refreshCart
      );
    };
  }, []);

  function changeQuantity(
    variantId: string,
    quantity: number
  ) {
    setItems(
      setCartQuantity(
        variantId,
        quantity
      )
    );
  }

  function removeItem(variantId: string) {
    setItems(removeFromCart(variantId));
  }

  const subtotal = items.reduce(
    (total, item) =>
      total + item.unitPrice * item.quantity,
    0
  );

  const totalUnits = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  if (!loaded) {
    return (
      <main className="min-h-screen bg-white" />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">

        <Link
          href="/compounds"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-[#D4A11E]"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>

        <div className="mt-6 sm:mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4A11E]">
            Member Order
          </p>

          <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">
            Your Cart
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            {totalUnits} {totalUnits === 1 ? "item" : "items"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[24px] border border-neutral-200 bg-white px-6 py-16 text-center sm:px-10 sm:py-20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <ShoppingBag
                size={24}
                strokeWidth={1.6}
              />
            </div>

            <h2 className="mt-5 text-2xl font-medium">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Browse the research catalog and select a compound
              strength to begin your order.
            </p>

            <Link
              href="/compounds"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-7 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#D4A11E] hover:text-black"
            >
              Browse Compounds
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">

            <section className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
              {items.map((item, index) => (
                <div
                  key={item.variantId}
                  className={`p-5 sm:p-6 ${
                    index !== items.length - 1
                      ? "border-b border-neutral-200"
                      : ""
                  }`}
                >
                  <div className="flex gap-4 sm:gap-6">

                    <Link
                      href={`/compound/${item.slug}`}
                      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:h-32 sm:w-32"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={120}
                          height={120}
                          className="max-h-full w-auto object-contain"
                        />
                      ) : (
                        <ShoppingBag
                          size={28}
                          strokeWidth={1.4}
                          className="text-neutral-300"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <Link
                            href={`/compound/${item.slug}`}
                            className="text-lg font-semibold transition hover:text-[#D4A11E] sm:text-xl"
                          >
                            {item.productName}
                          </Link>

                          <p className="mt-1 text-sm font-medium text-neutral-500">
                            {item.strength}
                          </p>

                          {item.sku && (
                            <p className="mt-1 text-xs text-neutral-400">
                              SKU {item.sku}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.variantId)
                          }
                          aria-label={`Remove ${item.productName} ${item.strength}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2
                            size={17}
                            strokeWidth={1.7}
                          />
                        </button>

                      </div>

                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">

                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                            Quantity
                          </p>

                          <div className="flex h-11 items-center overflow-hidden rounded-full border border-neutral-300 bg-white">

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                              className="flex h-full w-11 items-center justify-center transition hover:bg-neutral-100"
                            >
                              <Minus
                                size={15}
                                strokeWidth={1.8}
                              />
                            </button>

                            <span className="flex min-w-10 items-center justify-center text-sm font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              aria-label="Increase quantity"
                              className="flex h-full w-11 items-center justify-center transition hover:bg-neutral-100"
                            >
                              <Plus
                                size={15}
                                strokeWidth={1.8}
                              />
                            </button>

                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-neutral-400">
                            ${item.unitPrice.toFixed(2)} each
                          </p>

                          <p className="mt-1 text-xl font-semibold">
                            $
                            {(
                              item.unitPrice *
                              item.quantity
                            ).toFixed(2)}
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <aside className="rounded-[24px] border border-neutral-200 bg-white p-6 lg:sticky lg:top-28">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4A11E]">
                Order Summary
              </p>

              <div className="mt-6 space-y-4">

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

              </div>

              <div className="mt-6 border-t border-neutral-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-medium">
                    Estimated Total
                  </span>

                  <strong className="text-2xl">
                    ${subtotal.toFixed(2)}
                  </strong>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-[#D4A11E] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#b98b17]"
              >
                Continue to Checkout
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-neutral-400">
                Pricing and availability will be verified
                before your order is submitted.
              </p>

            </aside>

          </div>
        )}

      </div>
    </main>
  );
}