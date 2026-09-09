import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Circle,
  Mail,
  MapPin,
  Package,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  beginOrder,
  changeOrderPaymentMethod,
  confirmOrderInventory,
  completePickupOrder,
  completeShippingOrder,
  confirmPickupDetails,
  deleteAdminOrder,
  markOrderPaid,
  markOrderShipped,
  selectFulfillmentMethod,
} from "../actions";
import ConfirmDelete from "@/components/ConfirmDelete";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function orderStatusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-green-200 bg-green-50 text-green-700";
    case "SHIPPED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "PROCESSING":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "CONFIRMED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function paymentStatusClasses(status: string) {
  switch (status) {
    case "PAID":
      return "border-green-200 bg-green-50 text-green-700";
    case "REFUNDED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-600";
  }
}

function activityLabel(action: string) {
  switch (action) {
    case "ORDER_STARTED":
      return "Order started";
    case "INVENTORY_CONFIRMED":
      return "Inventory confirmed";
    case "PAYMENT_CONFIRMED":
      return "Payment confirmed";
    default:
      return action
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (value) => value.toUpperCase());
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },

    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },

      orderActivities: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          admin: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },

      items: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          variant: {
            select: {
              id: true,
              strength: true,
              sku: true,
              inventoryQty: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const inventoryConfirmed = order.orderActivities.some(
    (activity) => activity.action === "INVENTORY_CONFIRMED"
  );

  const orderStarted =
    order.status !== "PENDING" ||
    order.orderActivities.some(
      (activity) => activity.action === "ORDER_STARTED"
    );

  const paymentConfirmed = order.paymentStatus === "PAID";

  const fulfilled =
    order.status === "SHIPPED" ||
    order.status === "COMPLETED";

  const completed = order.status === "COMPLETED";

  const totalUnits = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const customerName =
    `${order.user.firstName} ${order.user.lastName}`.trim();

  const shippingName =
    `${order.shippingFirstName} ${order.shippingLastName}`.trim();

  const workflow = [
    {
      label: "Order Started",
      complete: orderStarted,
    },
    {
      label: "Inventory Confirmation",
      complete: inventoryConfirmed,
    },
    {
      label: "Payment",
      complete: paymentConfirmed,
    },
    {
      label: "Fulfillment",
      complete: fulfilled,
    },
    {
      label: "Complete",
      complete: completed,
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-[#D4A11E]"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      <section className="admin-panel p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="admin-eyebrow">
              ORDER REQUEST
            </span>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              {order.orderNumber}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              <span>{customerName}</span>
              <span className="text-neutral-300">|</span>
              <span>
                Submitted {formatDate(order.createdAt)}
              </span>
              <span className="text-neutral-300">|</span>
              <span>
                {totalUnits} {totalUnits === 1 ? "unit" : "units"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="flex flex-wrap gap-2">
              {order.channel !== "RETAIL" && (
                <span className="inline-flex rounded-full border border-[#D4A11E]/40 bg-[#D4A11E]/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A77C13]">
                  {order.channel}
                </span>
              )}

              <span
                className={`inline-flex rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${orderStatusClasses(
                  order.status
                )}`}
              >
                {order.status}
              </span>

              <span
                className={`inline-flex rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${paymentStatusClasses(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus === "PAID" && order.paymentMethod === "CASH" ? "COD" : order.paymentStatus}
              </span>
            </div>

            <div className="text-left lg:text-right">
              <span className="block text-xs uppercase tracking-[0.12em] text-neutral-400">
                Order Total
              </span>
              <strong className="mt-1 block text-3xl font-semibold text-neutral-950">
                {money(Number(order.total))}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="admin-panel min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
            <div>
              <span className="admin-eyebrow">
                ORDER
              </span>
              <h2 className="mt-1 text-lg font-semibold">
                Order Items
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Package size={17} />
              {totalUnits} {totalUnits === 1 ? "unit" : "units"}
            </div>
          </div>

          {/* Mobile order items */}
          <div className="md:hidden">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="border-b border-neutral-100 px-5 py-5 last:border-0"
              >
                <div>
                  <strong className="block text-sm font-semibold text-neutral-900">
                    {item.productName}
                  </strong>

                  <span className="mt-1 block text-xs text-neutral-400">
                    {item.strength}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[1.25fr_.55fr_1fr_1fr] gap-x-3">
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      SKU
                    </span>
                    <span className="mt-1.5 block whitespace-nowrap text-xs text-neutral-600">
                      {item.sku || item.variant?.sku || "-"}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Qty
                    </span>
                    <span className="mt-1.5 block text-sm font-semibold text-neutral-900">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Unit
                    </span>
                    <span className="mt-1.5 block whitespace-nowrap text-xs text-neutral-600">
                      {money(Number(item.unitPrice))}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Total
                    </span>
                    <span className="mt-1.5 block whitespace-nowrap text-xs font-semibold text-neutral-900">
                      {money(Number(item.lineTotal))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop order items */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  <th className="px-6 py-3">
                    Product
                  </th>
                  <th className="px-4 py-3">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-center">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-6 py-5">
                      <strong className="block text-sm font-semibold text-neutral-900">
                        {item.productName}
                      </strong>
                      <span className="mt-1 block text-xs text-neutral-400">
                        {item.strength}
                      </span>
                    </td>

                    <td className="px-4 py-5 text-sm text-neutral-500">
                      {item.sku || item.variant?.sku || "-"}
                    </td>

                    <td className="px-4 py-5 text-center text-sm font-semibold">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-5 text-right text-sm text-neutral-600">
                      {money(Number(item.unitPrice))}
                    </td>

                    <td className="px-6 py-5 text-right text-sm font-semibold">
                      {money(Number(item.lineTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ml-auto w-full max-w-sm border-t border-neutral-200 p-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-neutral-500">
                <span>Subtotal</span>
                <span>{money(Number(order.subtotal))}</span>
              </div>

              <div className="flex justify-between gap-4 text-neutral-500">
                <span>Shipping</span>
                <span>{money(Number(order.shippingAmount))}</span>
              </div>

              <div className="flex justify-between gap-4 text-neutral-500">
                <span>Tax</span>
                <span>{money(Number(order.taxAmount))}</span>
              </div>

              <div className="flex justify-between gap-4 border-t border-neutral-200 pt-4 text-base">
                <strong>Total</strong>
                <strong>{money(Number(order.total))}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel p-6">
          <span className="admin-eyebrow">
            ORDER WORKFLOW
          </span>

          <h2 className="mt-1 text-lg font-semibold">
            Processing
          </h2>

          <div className="mt-6 space-y-1">
            {workflow.map((step, index) => {
              const previousComplete =
                index === 0 ||
                workflow[index - 1].complete;

              const active =
                !step.complete &&
                previousComplete;

              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                    active
                      ? "bg-[#D4A11E]/5"
                      : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      step.complete
                        ? "border-green-200 bg-green-50 text-green-700"
                        : active
                          ? "border-[#D4A11E] bg-white text-[#A77C13]"
                          : "border-neutral-200 bg-white text-neutral-300"
                    }`}
                  >
                    {step.complete ? (
                      <Check size={14} />
                    ) : (
                      <Circle size={10} />
                    )}
                  </span>

                  <div>
                    <span
                      className={`block text-sm font-semibold ${
                        active
                          ? "text-neutral-950"
                          : step.complete
                            ? "text-neutral-700"
                            : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </span>

                    {active && (
                      <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A77C13]">
                        Current Step
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-6">
            {order.status === "PENDING" && (
              <form action={beginOrder}>
                <input
                  type="hidden"
                  name="orderId"
                  value={order.id}
                />

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#b98b17]"
                >
                  Begin Order
                </button>
              </form>
            )}

            {order.status === "PROCESSING" &&
              !inventoryConfirmed && (
                <form action={confirmOrderInventory}>
                  <input
                    type="hidden"
                    name="orderId"
                    value={order.id}
                  />

                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#b98b17]"
                  >
                    Confirm Inventory
                  </button>
                </form>
              )}

            {inventoryConfirmed &&
              order.paymentStatus !== "PAID" &&
              order.status !== "CANCELLED" && (
                <div>
                  <p className="mb-4 text-sm leading-6 text-neutral-500">
                    Inventory is confirmed. Select the
                    payment method after payment has been
                    received.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <form action={markOrderPaid}>
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />
                      <input
                        type="hidden"
                        name="paymentMethod"
                        value="CASH"
                      />

                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4A11E] bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#A77C13] transition hover:bg-[#D4A11E]/5"
                      >
                        Cash
                      </button>
                    </form>

                    <form action={markOrderPaid}>
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />
                      <input
                        type="hidden"
                        name="paymentMethod"
                        value="ZELLE"
                      />

                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#D4A11E] px-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#b98b17]"
                      >
                        Zelle
                      </button>
                    </form>
                  </div>
                </div>
              )}

            {order.paymentStatus === "PAID" &&
              !order.fulfillmentMethod &&
              !fulfilled && (
                <div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-green-700">
                      Payment Confirmed
                    </span>

                    <p className="mt-1 text-sm text-green-800">
                      {order.paymentMethod
                        ? `Paid via ${order.paymentMethod}.`
                        : "Payment has been received."}
                      {" "}Choose how this order will be fulfilled.
                    </p>
                  </div>

                  <form
                    action={changeOrderPaymentMethod}
                    className="mt-3"
                  >
                    <input
                      type="hidden"
                      name="orderId"
                      value={order.id}
                    />
                    <input
                      type="hidden"
                      name="paymentMethod"
                      value={
                        order.paymentMethod === "CASH"
                          ? "ZELLE"
                          : "CASH"
                      }
                    />

                    <button
                      type="submit"
                      className="text-xs font-medium text-neutral-500 underline underline-offset-4 transition hover:text-neutral-900"
                    >
                      {order.paymentMethod === "CASH"
                        ? "Change Payment to Zelle"
                        : "Change Payment to Cash"}
                    </button>
                  </form>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <form action={selectFulfillmentMethod}>
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />
                      <input
                        type="hidden"
                        name="fulfillmentMethod"
                        value="SHIPPING"
                      />

                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4A11E] bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#A77C13] transition hover:bg-[#D4A11E]/5"
                      >
                        Shipping
                      </button>
                    </form>

                    <form action={selectFulfillmentMethod}>
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />
                      <input
                        type="hidden"
                        name="fulfillmentMethod"
                        value="PICKUP"
                      />

                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#D4A11E] px-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#b98b17]"
                      >
                        Pickup
                      </button>
                    </form>
                  </div>
                </div>
              )}

            {order.fulfillmentMethod === "PICKUP" &&
              !order.pickupScheduledAt &&
              !completed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">
                    Waiting for Member
                  </span>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Pickup selected. The member needs to choose an available pickup date and time.
                  </p>
                </div>
              )}
            {order.fulfillmentMethod === "PICKUP" &&
              order.pickupScheduledAt &&
              !order.pickupConfirmedAt &&
              !completed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">
                    Pickup Time Selected
                  </span>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/Los_Angeles",
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    }).format(order.pickupScheduledAt)}
                  </p>

                  <p className="mt-2 text-sm text-amber-800">
                    Enter the pickup location and confirm the appointment.
                  </p>

                  <form action={confirmPickupDetails} className="mt-4 space-y-3">
                    <input type="hidden" name="orderId" value={order.id} />

                    <input
                      name="pickupAddress1"
                      placeholder="Street address"
                      required
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#D4A11E]"
                    />

                    <input
                      name="pickupAddress2"
                      placeholder="Suite / Unit (optional)"
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#D4A11E]"
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        name="pickupCity"
                        placeholder="City"
                        required
                        className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#D4A11E]"
                      />

                      <input
                        name="pickupState"
                        placeholder="State"
                        required
                        className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#D4A11E]"
                      />

                      <input
                        name="pickupPostalCode"
                        placeholder="ZIP"
                        required
                        className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#D4A11E]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#D4A11E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Confirm Pickup
                    </button>
                  </form>
                </div>
              )}

            {order.fulfillmentMethod === "PICKUP" &&
              order.pickupScheduledAt &&
              order.pickupConfirmedAt &&
              !completed && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-green-800">
                    Pickup Confirmed
                  </span>

                  <p className="mt-1 text-sm font-medium leading-6 text-green-900">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/Los_Angeles",
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    }).format(order.pickupScheduledAt)}
                  </p>

                  <div className="mt-3 text-sm leading-6 text-green-800">
                    <div>{order.pickupAddress1}</div>
                    {order.pickupAddress2 && <div>{order.pickupAddress2}</div>}
                    <div>
                      {order.pickupCity}, {order.pickupState}{" "}
                      {order.pickupPostalCode}
                    </div>
                  </div>

                  <form action={completePickupOrder} className="mt-4">
                    <input type="hidden" name="orderId" value={order.id} />

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                      Complete Pickup
                    </button>
                  </form>
                </div>
              )}
            {order.fulfillmentMethod === "SHIPPING" &&
              !order.shippedAt &&
              !completed && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">
                    Ready to Ship
                  </span>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Shipping selected. Enter the tracking number when the package is ready to leave.
                  </p>

                  <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 text-sm leading-6 text-neutral-600">
                    <strong className="block text-neutral-900">
                      {shippingName}
                    </strong>

                    <span className="block">
                      {order.shippingAddress1}
                    </span>

                    {order.shippingAddress2 && (
                      <span className="block">
                        {order.shippingAddress2}
                      </span>
                    )}

                    <span className="block">
                      {order.shippingCity}, {order.shippingState}{" "}
                      {order.shippingPostalCode}
                    </span>
                  </div>

                  <form action={markOrderShipped} className="mt-4">
                    <input
                      type="hidden"
                      name="orderId"
                      value={order.id}
                    />

                    <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-blue-800">
                      Tracking Number
                    </label>

                    <input
                      type="text"
                      name="trackingNumber"
                      required
                      autoComplete="off"
                      placeholder="Enter tracking number"
                      className="mt-2 min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-[#D4A11E]"
                    />

                    <button
                      type="submit"
                      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-[#D4A11E] px-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#b98b17]"
                    >
                      Mark as Shipped
                    </button>
                  </form>
                </div>
              )}

            {order.fulfillmentMethod === "SHIPPING" &&
              order.shippedAt &&
              order.status === "SHIPPED" &&
              !completed && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-green-800">
                    Order Shipped
                  </span>

                  <p className="mt-1 text-sm leading-6 text-green-800">
                    This order has been marked as shipped.
                  </p>

                  <div className="mt-4 rounded-lg border border-green-200 bg-white p-4 text-sm leading-6 text-neutral-600">
                    <div>
                      <span className="text-xs text-neutral-400">
                        Tracking Number
                      </span>
                      <strong className="mt-1 block text-neutral-900">
                        {order.trackingNumber}
                      </strong>
                    </div>

                    <div className="mt-3">
                      <span className="text-xs text-neutral-400">
                        Shipped
                      </span>
                      <strong className="mt-1 block text-neutral-900">
                        {formatDate(order.shippedAt)}
                      </strong>
                    </div>
                  </div>

                  <form
                    action={completeShippingOrder}
                    className="mt-4"
                  >
                    <input
                      type="hidden"
                      name="orderId"
                      value={order.id}
                    />

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                      Complete Order
                    </button>
                  </form>
                </div>
              )}

            {completed && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                This order is complete.
              </div>
            )}
          </div>

          {order.paymentMethod && (
            <div className="mt-6 border-t border-neutral-200 pt-5">
              <span className="text-xs text-neutral-400">
                Payment Method
              </span>
              <strong className="mt-1 block text-sm">
                {order.paymentMethod}
              </strong>

              {order.paidAt && (
                <span className="mt-1 block text-xs text-neutral-400">
                  {formatDate(order.paidAt)}
                </span>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-panel p-6">
          <div className="flex items-center gap-3">
            <UserRound
              size={18}
              className="text-[#D4A11E]"
            />
            <div>
              <span className="admin-eyebrow">
                CUSTOMER
              </span>
              <h2 className="mt-1 text-lg font-semibold">
                Member Information
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <span className="text-xs text-neutral-400">
                Name
              </span>
              <strong className="mt-1 block text-sm">
                {customerName}
              </strong>
            </div>

            <div className="flex items-start gap-3">
              <Mail
                size={16}
                className="mt-0.5 text-neutral-400"
              />
              <a
                href={`mailto:${order.user.email}`}
                className="text-sm text-neutral-600 hover:text-[#D4A11E]"
              >
                {order.user.email}
              </a>
            </div>

            {order.user.phone && (
              <div className="flex items-start gap-3">
                <Phone
                  size={16}
                  className="mt-0.5 text-neutral-400"
                />
                <span className="text-sm text-neutral-600">
                  {order.user.phone}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel p-6">
          <div className="flex items-center gap-3">
            <MapPin
              size={18}
              className="text-[#D4A11E]"
            />
            <div>
              <span className="admin-eyebrow">
                DELIVERY
              </span>
              <h2 className="mt-1 text-lg font-semibold">
                Shipping Information
              </h2>
            </div>
          </div>

          <div className="mt-6 text-sm leading-6 text-neutral-600">
            <strong className="block text-neutral-900">
              {shippingName}
            </strong>

            {order.shippingCompany && (
              <span className="block">
                {order.shippingCompany}
              </span>
            )}

            <span className="block">
              {order.shippingAddress1}
            </span>

            {order.shippingAddress2 && (
              <span className="block">
                {order.shippingAddress2}
              </span>
            )}

            <span className="block">
              {order.shippingCity}, {order.shippingState}{" "}
              {order.shippingPostalCode}
            </span>

            {order.shippingPhone && (
              <div className="mt-4 flex items-center gap-3">
                <Phone
                  size={16}
                  className="text-neutral-400"
                />
                <span>{order.shippingPhone}</span>
              </div>
            )}

            {order.trackingNumber && (
              <div className="mt-5 border-t border-neutral-200 pt-4">
                <span className="text-xs text-neutral-400">
                  Tracking Number
                </span>
                <strong className="mt-1 block text-sm text-neutral-900">
                  {order.trackingNumber}
                </strong>
              </div>
            )}
          </div>
        </section>
      </div>

      {(order.customerNote || order.adminNote) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {order.customerNote && (
            <section className="admin-panel p-6">
              <span className="admin-eyebrow">
                CUSTOMER NOTE
              </span>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                {order.customerNote}
              </p>
            </section>
          )}

          {order.adminNote && (
            <section className="admin-panel p-6">
              <span className="admin-eyebrow">
                INTERNAL NOTE
              </span>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                {order.adminNote}
              </p>
            </section>
          )}
        </div>
      )}

      <section className="admin-panel p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="admin-eyebrow">
              INTERNAL ACTIVITY
            </span>
            <h2 className="mt-1 text-lg font-semibold">
              Order History
            </h2>
          </div>

          <span className="text-xs text-neutral-400">
            Admin only
          </span>
        </div>

        {order.orderActivities.length > 0 ? (
          <div className="mt-6 divide-y divide-neutral-100 border-t border-neutral-200">
            {[...order.orderActivities]
              .reverse()
              .map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <strong className="block text-sm font-semibold text-neutral-900">
                      {activityLabel(activity.action)}
                    </strong>

                    <span className="mt-1 block text-xs text-neutral-500">
                      {activity.details || "No additional details."}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="block text-xs font-medium text-neutral-600">
                      {activity.admin.firstName}{" "}
                      {activity.admin.lastName}
                    </span>

                    <span className="mt-1 block text-xs text-neutral-400">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-neutral-500">
            No order activity has been recorded yet.
          </p>
        )}
      </section>

      {order.status !== "COMPLETED" && (
          <div className="flex justify-end">
            <ConfirmDelete
              action={deleteAdminOrder}
              message={`Delete ${order.orderNumber}? This cannot be undone.`}
            >
              <input
                type="hidden"
                name="orderId"
                value={order.id}
              />

              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete Order
              </button>
            </ConfirmDelete>
          </div>
        )}
    </div>
  );
}











