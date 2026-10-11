"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  ChevronDown,
  Clock3,
  Loader2,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
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
  inventoryQty: number | null;
  trackInventory: boolean;
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

type PickupSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
};

type PickupSlotsResponse = {
  ok: boolean;
  slots?: PickupSlot[];
  error?: string;
};

type SubmitResponse = {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  subtotal?: number;
  shippingAmount?: number;
  taxAmount?: number;
  total?: number;
  error?: string;
  errors?: string[];
};

type FulfillmentMethod = "SHIPPING" | "PICKUP";
type PaymentMethod = "CASH" | "ZELLE";

type PickupDay = {
  dateKey: string;
  label: string;
  windowLabel: string;
  slots: PickupSlot[];
};

const PACIFIC_TIME_ZONE = "America/Los_Angeles";
const SHIPPING_AMOUNT = 20;
const ZELLE_DESTINATION = "ascendpepco@gmail.com";

function formatPacificDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(dateValue));
}

function formatPacificDateKey(dateValue: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateValue));

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatPacificTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function buildPickupDays(slots: PickupSlot[]) {
  const grouped = new Map<string, PickupSlot[]>();

  for (const slot of slots) {
    const key = formatPacificDateKey(slot.startsAt);
    const existing = grouped.get(key) ?? [];
    existing.push(slot);
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries()).map(
    ([dateKey, daySlots]): PickupDay => {
      const first = daySlots[0];
      const last = daySlots[daySlots.length - 1];

      return {
        dateKey,
        label: formatPacificDate(first.startsAt),
        windowLabel: `${formatPacificTime(
          first.startsAt
        )} - ${formatPacificTime(last.endsAt)}`,
        slots: daySlots,
      };
    }
  );
}

export default function CheckoutOrderSummary() {
  const router = useRouter();
  const orderSubmittedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<
    string | null
  >(null);

  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [valid, setValid] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("SHIPPING");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("ZELLE");

  const [zelleConfirmation, setZelleConfirmation] =
    useState("");

  const [pickupSlots, setPickupSlots] = useState<
    PickupSlot[]
  >([]);

  const [pickupLoading, setPickupLoading] =
    useState(false);

  const [pickupError, setPickupError] = useState<
    string | null
  >(null);

  const [pickupSlotId, setPickupSlotId] =
    useState("");

  const [openPickupDay, setOpenPickupDay] =
    useState("");

  const pickupDays = useMemo(
    () => buildPickupDays(pickupSlots),
    [pickupSlots]
  );

  const selectedPickupSlot =
    pickupSlots.find(
      (slot) => slot.id === pickupSlotId
    ) ?? null;

  const shipping =
    fulfillmentMethod === "SHIPPING"
      ? SHIPPING_AMOUNT
      : 0;

  const total = subtotal + shipping;

  const zelleRequired =
    paymentMethod === "ZELLE";

  const canSubmit =
    valid &&
    items.length > 0 &&
    !submitting &&
    (fulfillmentMethod !== "PICKUP" ||
      Boolean(pickupSlotId)) &&
    (!zelleRequired ||
      Boolean(zelleConfirmation.trim()));

  async function validateCart() {
    if (orderSubmittedRef.current) {
      return;
    }

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

  async function loadPickupSlots() {
    setPickupLoading(true);
    setPickupError(null);

    try {
      const response = await fetch(
        "/api/checkout/pickup-slots",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as PickupSlotsResponse;

      if (!response.ok || !data.ok) {
        setPickupSlots([]);
        setPickupError(
          data.error ??
            "Pickup times could not be loaded."
        );
        return;
      }

      const slots = data.slots ?? [];

      setPickupSlots(slots);

      if (slots.length === 0) {
        setPickupError(
          "No pickup appointments are currently available."
        );
        return;
      }

      const days = buildPickupDays(slots);

      setOpenPickupDay((current) =>
        current || days[0]?.dateKey || ""
      );
    } catch {
      setPickupSlots([]);
      setPickupError(
        "Pickup times could not be loaded. Please try again."
      );
    } finally {
      setPickupLoading(false);
    }
  }

  function selectFulfillment(
    method: FulfillmentMethod
  ) {
    if (submitting) {
      return;
    }

    setSubmitError(null);
    setFulfillmentMethod(method);

    if (method === "SHIPPING") {
      setPaymentMethod("ZELLE");
      setPickupSlotId("");
    } else {
      setPaymentMethod("CASH");

      if (
        pickupSlots.length === 0 &&
        !pickupLoading
      ) {
        void loadPickupSlots();
      }
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
      item.inventoryQty !== null &&
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

  async function submitOrder() {
    if (!canSubmit) {
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
        setSubmitError("Your cart is empty.");
        setSubmitting(false);
        return;
      }

      const response = await fetch(
        "/api/checkout/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: requestItems,
            fulfillmentMethod,
            paymentMethod,
            zelleConfirmation:
              paymentMethod === "ZELLE"
                ? zelleConfirmation.trim()
                : undefined,
            pickupSlotId:
              fulfillmentMethod === "PICKUP"
                ? pickupSlotId
                : undefined,
          }),
        }
      );

      const data =
        (await response.json()) as SubmitResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.orderNumber
      ) {
        setSubmitError(
          data.error ??
            "Your order could not be submitted. Please try again."
        );

        if (
          response.status === 409 &&
          fulfillmentMethod === "PICKUP"
        ) {
          setPickupSlotId("");
          void loadPickupSlots();
        }

        setSubmitting(false);
        return;
      }

      const orderNumber = data.orderNumber;

      orderSubmittedRef.current = true;
      clearCart();

      router.push(
        `/checkout/success?order=${encodeURIComponent(
          orderNumber
        )}`
      );
    } catch {
      setSubmitError(
        "Your order could not be submitted. Please try again."
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
          Submit Order
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
            item.inventoryQty !== null &&
            item.quantity >= item.inventoryQty;

          const productHref =
            item.slug && item.slug !== "distro"
              ? `/compound/${item.slug}`
              : null;

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
                  {productHref ? (
                    <Link
                      href={productHref}
                      className="text-sm font-semibold text-neutral-950 transition hover:text-[#D4A11E]"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-neutral-950">
                      {item.productName}
                    </p>
                  )}

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

                {item.trackInventory &&
                  item.inventoryQty !== null && (
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

      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Fulfillment
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              selectFulfillment("SHIPPING")
            }
            className={`rounded-[14px] border-2 p-4 text-left transition ${
              fulfillmentMethod === "SHIPPING"
                ? "border-[#D4A11E] bg-[#D4A11E]/5"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <Truck
              size={20}
              className={
                fulfillmentMethod === "SHIPPING"
                  ? "text-[#D4A11E]"
                  : "text-neutral-400"
              }
            />

            <strong className="mt-3 block text-sm">
              Shipping
            </strong>

            <span className="mt-1 block text-xs text-neutral-500">
              $20.00
            </span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              selectFulfillment("PICKUP")
            }
            className={`rounded-[14px] border-2 p-4 text-left transition ${
              fulfillmentMethod === "PICKUP"
                ? "border-[#D4A11E] bg-[#D4A11E]/5"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <PackageCheck
              size={20}
              className={
                fulfillmentMethod === "PICKUP"
                  ? "text-[#D4A11E]"
                  : "text-neutral-400"
              }
            />

            <strong className="mt-3 block text-sm">
              Pickup
            </strong>

            <span className="mt-1 block text-xs text-neutral-500">
              Free
            </span>
          </button>
        </div>
      </div>

      {fulfillmentMethod === "PICKUP" && (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <div className="flex items-center gap-2">
            <Clock3
              size={17}
              className="text-[#D4A11E]"
            />

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Pickup Date & Time
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Select an available pickup appointment.
            All times are Pacific Time.
          </p>

          {pickupLoading ? (
            <div className="mt-4 flex items-center gap-2 rounded-[14px] border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500">
              <Loader2
                size={15}
                className="animate-spin"
              />
              Loading pickup times...
            </div>
          ) : pickupError ? (
            <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs leading-5 text-amber-800">
                {pickupError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadPickupSlots()
                }
                className="mt-3 text-xs font-semibold text-amber-900 underline underline-offset-2"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {pickupDays.map((day) => {
                const isOpen =
                  openPickupDay === day.dateKey;

                return (
                  <div
                    key={day.dateKey}
                    className="overflow-hidden rounded-[14px] border border-neutral-200"
                  >
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        setOpenPickupDay(
                          isOpen
                            ? ""
                            : day.dateKey
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-neutral-50"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-neutral-950">
                          {day.label}
                        </span>

                        <span className="mt-1 block text-[11px] text-neutral-500">
                          {day.windowLabel}
                        </span>
                      </span>

                      <ChevronDown
                        size={17}
                        className={
                          isOpen
                            ? "shrink-0 rotate-180 transition-transform"
                            : "shrink-0 transition-transform"
                        }
                      />
                    </button>

                    {isOpen && (
                      <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 p-3">
                        {day.slots.map((slot) => {
                          const selected =
                            pickupSlotId ===
                            slot.id;

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                setPickupSlotId(
                                  slot.id
                                )
                              }
                              className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                                selected
                                  ? "border-[#D4A11E] bg-[#D4A11E]/10 text-[#9a7415]"
                                  : "border-neutral-200 text-neutral-800 hover:border-[#D4A11E]"
                              }`}
                            >
                              {formatPacificTime(
                                slot.startsAt
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedPickupSlot && (
            <div className="mt-3 flex gap-2 rounded-[12px] bg-green-50 p-3 text-xs leading-5 text-green-800">
              <MapPin
                size={15}
                className="mt-0.5 shrink-0"
              />
              <span>
                Pickup selected:{" "}
                <strong>
                  {formatPacificDate(
                    selectedPickupSlot.startsAt
                  )}{" "}
                  at{" "}
                  {formatPacificTime(
                    selectedPickupSlot.startsAt
                  )}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Payment
        </p>

        {fulfillmentMethod === "SHIPPING" ? (
          <div className="mt-3 rounded-[14px] border-2 border-[#D4A11E] bg-[#D4A11E]/5 p-4">
            <strong className="text-sm">
              Zelle
            </strong>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Shipping orders are paid by Zelle.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setPaymentMethod("CASH");
                setZelleConfirmation("");
                setSubmitError(null);
              }}
              className={`rounded-[14px] border-2 p-4 text-left transition ${
                paymentMethod === "CASH"
                  ? "border-[#D4A11E] bg-[#D4A11E]/5"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <Banknote
                size={19}
                className={
                  paymentMethod === "CASH"
                    ? "text-[#D4A11E]"
                    : "text-neutral-400"
                }
              />

              <strong className="mt-3 block text-sm">
                Cash
              </strong>

              <span className="mt-1 block text-[11px] text-neutral-500">
                Pay at pickup
              </span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setPaymentMethod("ZELLE");
                setSubmitError(null);
              }}
              className={`rounded-[14px] border-2 p-4 text-left transition ${
                paymentMethod === "ZELLE"
                  ? "border-[#D4A11E] bg-[#D4A11E]/5"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <strong className="block text-sm">
                Zelle
              </strong>

              <span className="mt-1 block text-[11px] text-neutral-500">
                Send before submitting
              </span>
            </button>
          </div>
        )}

        {paymentMethod === "ZELLE" && (
          <div className="mt-4 rounded-[14px] border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">
              Send Zelle payment to
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-neutral-950">
              {ZELLE_DESTINATION}
            </p>

            <label
              htmlFor="zelle-confirmation"
              className="mt-4 block text-xs font-semibold text-neutral-700"
            >
              Zelle Confirmation #
            </label>

            <input
              id="zelle-confirmation"
              type="text"
              value={zelleConfirmation}
              disabled={submitting}
              onChange={(event) => {
                setZelleConfirmation(
                  event.target.value
                );
                setSubmitError(null);
              }}
              maxLength={120}
              autoComplete="off"
              placeholder="Enter confirmation number"
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-[#D4A11E] disabled:bg-neutral-100"
            />

            <p className="mt-2 text-[11px] leading-5 text-neutral-400">
              Your payment will show as pending
              until Ascend verifies the Zelle
              transaction.
            </p>
          </div>
        )}
      </div>

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
            {fulfillmentMethod === "SHIPPING"
              ? "Shipping"
              : "Pickup"}
          </span>

          <span className="font-medium">
            {shipping > 0
              ? `$${shipping.toFixed(2)}`
              : "Free"}
          </span>
        </div>

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-neutral-500">
            Tax
          </span>

          <span className="font-medium">
            $0.00
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="font-medium">
              Order Total
            </span>

            <p className="mt-1 text-[11px] text-neutral-400">
              {paymentMethod === "ZELLE"
                ? "Zelle payment subject to verification"
                : "Cash due at pickup"}
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
        disabled={!canSubmit}
        onClick={submitOrder}
        className={`mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.16em] transition ${
          canSubmit
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
            Submitting Order...
          </>
        ) : (
          <>Submit Order - ${total.toFixed(2)}</>
        )}
      </button>

      {!canSubmit && !submitting && (
        <p className="mt-3 text-center text-[11px] leading-5 text-neutral-400">
          {fulfillmentMethod === "PICKUP" &&
          !pickupSlotId
            ? "Select a pickup date and time to continue."
            : paymentMethod === "ZELLE" &&
                !zelleConfirmation.trim()
              ? "Enter your Zelle confirmation number to continue."
              : "Complete the required checkout information to continue."}
        </p>
      )}

      <p className="mt-3 text-center text-[11px] leading-5 text-neutral-400">
        Prices and availability are verified again
        when your order is submitted.
      </p>
    </>
  );
}
