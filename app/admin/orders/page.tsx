import Link from "next/link";
import {
  Clock3,
  DollarSign,
  Eye,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { deleteAdminOrder } from "./actions";

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

function pickupDay(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(value);
}

function pickupTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
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

export default async function OrdersPage() {
  const now = new Date();

  const pacificDateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const pacificYear = Number(
    pacificDateParts.find((part) => part.type === "year")?.value
  );
  const pacificMonth = Number(
    pacificDateParts.find((part) => part.type === "month")?.value
  );
  const pacificDayNumber = Number(
    pacificDateParts.find((part) => part.type === "day")?.value
  );

  // September is PDT, so Pacific midnight is 07:00 UTC.
  // We will replace this with a reusable timezone helper later if needed.
  const pickupWindowStart = new Date(
    Date.UTC(pacificYear, pacificMonth - 1, pacificDayNumber, 7)
  );

  const pickupWindowEnd = new Date(
    pickupWindowStart.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const upcomingPickups = await prisma.order.findMany({
    where: {
      fulfillmentMethod: "PICKUP",
      pickupScheduledAt: {
        not: null,
        gte: pickupWindowStart,
        lt: pickupWindowEnd,
      },
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
    select: {
      id: true,
      orderNumber: true,
      pickupScheduledAt: true,
      pickupConfirmedAt: true,
      paymentMethod: true,
      paymentStatus: true,
      total: true,
      shippingPhone: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          productName: true,
        },
      },
    },
    orderBy: {
      pickupScheduledAt: "asc",
    },
  });

  const shippingQueue = await prisma.order.findMany({
    where: {
      fulfillmentMethod: "SHIPPING",
      paymentStatus: "PAID",
      shippedAt: null,
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentMethod: true,
      shippingFirstName: true,
      shippingLastName: true,
      shippingAddress1: true,
      shippingAddress2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
      shippingPhone: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          productName: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const pickupDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      pickupWindowStart.getTime() + index * 24 * 60 * 60 * 1000
    );

    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    const pickups = upcomingPickups.filter((pickup) => {
      if (!pickup.pickupScheduledAt) return false;

      const pickupKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(pickup.pickupScheduledAt);

      return pickupKey === dateKey;
    });

    return {
      date,
      dateKey,
      pickups,
    };
  });

  const orders = await prisma.order.findMany({
    where: {
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },

      items: {
        select: {
          id: true,
          quantity: true,
        },
      },
    },
  });

  const completedStats = await prisma.order.aggregate({
    where: {
      status: "COMPLETED",
    },
    _count: {
      _all: true,
    },
    _sum: {
      total: true,
    },
  });

  const completedOrders = completedStats._count._all;
  const completedValue = Number(completedStats._sum.total ?? 0);

  const newRequests = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const processing = orders.filter(
    (order) =>
      order.status === "CONFIRMED" ||
      order.status === "PROCESSING"
  ).length;

  const merchandiseValue = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce(
      (sum, order) => sum + Number(order.subtotal),
      0
    );

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            COMMERCE
          </span>

          <h1>Orders</h1>

          <p>
            Review member order requests, payment status
            and fulfillment activity.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
            <ShoppingBag size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Active Orders
            </span>

            <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
              {orders.length}
            </strong>
          </div>
        </article>

        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Clock3 size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              New Requests
            </span>

            <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
              {newRequests}
            </strong>
          </div>
        </article>

        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700">
            <PackageCheck size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Processing
            </span>

            <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
              {processing}
            </strong>
          </div>
        </article>

        <Link
          href="/admin/orders/completed"
          className="admin-panel flex items-center gap-4 p-5 transition hover:border-[#D4A11E]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
            <PackageCheck size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Completed Orders
            </span>

            <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
              {completedOrders}
            </strong>

            <span className="mt-0.5 block text-xs text-neutral-500">
              {money(completedValue)} value
            </span>
          </div>
        </Link>
      </section>

      <section className="admin-panel mt-6 overflow-hidden">
        <div className="admin-panel-heading">
          <div>
            <h2 className="text-xl font-semibold text-[#D4A11E]">
              Order Queue
            </h2>

          </div>

          <span className="admin-member-total">
            {orders.length} total
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-neutral-500">
            No order requests have been submitted yet.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-left">
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Order
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Date
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Items
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Merchandise
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Order Status
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Payment
                    </th>
                    <th className="px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const itemCount = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-neutral-100 transition last:border-b-0 hover:bg-neutral-50/70"
                      >
                        <td className="px-5 py-5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-semibold text-neutral-950 transition hover:text-[#D4A11E]"
                          >
                            {order.orderNumber}
                          </Link>

                          {order.channel !== "RETAIL" && (
                            <span className="mt-2 block w-fit rounded-full border border-[#D4A11E]/40 bg-[#D4A11E]/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#A77C13]">
                              {order.channel}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <div>
                            <strong className="block text-sm font-medium text-neutral-900">
                              {order.user.firstName}{" "}
                              {order.user.lastName}
                            </strong>
                            <span className="mt-1 block text-xs text-neutral-400">
                              {order.user.email}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-sm text-neutral-500">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="px-5 py-5 text-sm font-medium text-neutral-700">
                          {itemCount}
                        </td>

                        <td className="px-5 py-5 text-sm font-semibold text-neutral-950">
                          {money(Number(order.subtotal))}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${orderStatusClasses(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${paymentStatusClasses(
                              order.paymentStatus
                            )}`}
                          >
                            {order.paymentStatus === "PAID" && order.paymentMethod === "CASH" ? "COD" : order.paymentStatus}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            title={`View ${order.orderNumber}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-[#D4A11E] hover:text-[#D4A11E]"
                          >
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-neutral-200 md:hidden">
              {orders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-5 transition active:bg-neutral-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B1841A]">
                          Order
                        </span>

                        <strong className="mt-1 block truncate text-base font-semibold text-neutral-950">
                          {order.orderNumber}
                        </strong>

                        {order.channel !== "RETAIL" && (
                          <span className="mt-2 block w-fit rounded-full border border-[#D4A11E]/40 bg-[#D4A11E]/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#A77C13]">
                            {order.channel}
                          </span>
                        )}
                      </div>

                      <span className="shrink-0 text-sm font-medium text-neutral-400">
                            {"View >"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <strong className="block text-sm font-medium text-neutral-900">
                        {order.user.firstName}{" "}
                        {order.user.lastName}
                      </strong>

                      <span className="mt-1 block truncate text-xs text-neutral-400">
                        {order.user.email}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Date
                        </span>
                        <span className="mt-1 block text-xs text-neutral-600">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Items
                        </span>
                        <span className="mt-1 block text-xs font-medium text-neutral-700">
                          {itemCount}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Merchandise
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-neutral-950">
                          {money(Number(order.subtotal))}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${orderStatusClasses(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${paymentStatusClasses(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus === "PAID" && order.paymentMethod === "CASH" ? "COD" : order.paymentStatus}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="admin-panel mt-6 overflow-hidden">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">PICKUP SCHEDULE</span>
            <h2 className="text-xl font-semibold text-[#D4A11E]">
              Next 7 Days
            </h2>
          </div>

          <span className="admin-member-total">
            {upcomingPickups.length} scheduled
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[980px] grid-cols-7 divide-x divide-neutral-200">
            {pickupDays.map((day, dayIndex) => (
              <div key={day.dateKey} className="min-w-0">
                <div
                  className={`border-b border-neutral-200 px-3 py-4 text-center ${
                    dayIndex === 0 ? "bg-[#D4A11E]/10" : "bg-neutral-50/70"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/Los_Angeles",
                      weekday: "short",
                    }).format(day.date)}
                  </span>

                  <strong className="mt-1 block text-sm text-neutral-950">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/Los_Angeles",
                      month: "short",
                      day: "numeric",
                    }).format(day.date)}
                  </strong>

                  <span
                    className={`mt-2 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      day.pickups.length > 0
                        ? "bg-[#D4A11E] text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {day.pickups.length}
                  </span>
                </div>

                <div className="divide-y divide-neutral-100">
                  {day.pickups.length === 0 ? (
                    <div className="px-3 py-8 text-center text-xs text-neutral-400">
                      No pickups
                    </div>
                  ) : (
                    day.pickups.map((pickup) => (
                      <details
                        key={pickup.id}
                        className="group px-3 py-3 open:bg-neutral-50"
                      >
                        <summary className="cursor-pointer list-none">
                          <span className="block text-sm font-semibold text-[#B1841A]">
                            {pickupTime(pickup.pickupScheduledAt!)}
                          </span>

                          <strong className="mt-1 block truncate text-xs text-neutral-900">
                            {pickup.user.firstName} {pickup.user.lastName}
                          </strong>

                          <span className="mt-1 block truncate text-[10px] text-neutral-400">
                            {pickup.orderNumber}
                          </span>

                          <span className="mt-2 block text-[10px] font-medium text-neutral-400 group-open:hidden">
                            Click for details
                          </span>
                        </summary>

                        <div className="mt-3 border-t border-neutral-200 pt-3 text-xs">
                          <div>
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                              Customer
                            </span>
                            <strong className="mt-1 block text-neutral-900">
                              {pickup.user.firstName} {pickup.user.lastName}
                            </strong>
                            <span className="mt-1 block break-all text-neutral-500">
                              {pickup.user.email}
                            </span>
                            {pickup.shippingPhone && (
                              <span className="mt-1 block text-neutral-500">
                                {pickup.shippingPhone}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[9px] uppercase text-neutral-400">
                                Payment
                              </span>
                              <strong className="mt-1 block text-neutral-800">
                                {pickup.paymentStatus === "PAID" &&
                                pickup.paymentMethod === "CASH"
                                  ? "COD"
                                  : pickup.paymentStatus}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[9px] uppercase text-neutral-400">
                                Total
                              </span>
                              <strong className="mt-1 block text-neutral-800">
                                {money(Number(pickup.total))}
                              </strong>
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                              Items
                            </span>
                            <div className="mt-1 space-y-1">
                              {pickup.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between gap-2 text-neutral-600"
                                >
                                  <span className="min-w-0 truncate">
                                    {item.productName}
                                  </span>
                                  <span className="shrink-0 font-medium">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                                pickup.pickupConfirmedAt
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {pickup.pickupConfirmedAt
                                ? "Confirmed"
                                : "Awaiting Confirmation"}
                            </span>
                          </div>

                          <Link
                            href={`/admin/orders/${pickup.id}`}
                            className="mt-3 flex min-h-9 items-center justify-center rounded-lg border border-[#D4A11E]/50 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A77C13] transition hover:bg-[#D4A11E]/5"
                          >
                            View Order
                          </Link>
                        </div>
                      </details>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="admin-panel mt-6 overflow-hidden">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">FULFILLMENT</span>
            <h2 className="text-xl font-semibold text-[#D4A11E]">
              Shipping Queue
            </h2>
          </div>

          <span className="admin-member-total">
            {shippingQueue.length} waiting
          </span>
        </div>

        {shippingQueue.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">
            No orders are waiting to ship.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {shippingQueue.map((order) => (
              <details
                key={order.id}
                className="group open:bg-neutral-50"
              >
                <summary className="cursor-pointer list-none px-5 py-4 md:px-6">
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-semibold text-neutral-950">
                          {order.orderNumber}
                        </strong>

                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-blue-700">
                          Ready to Ship
                        </span>
                      </div>

                      <span className="mt-1 block truncate text-sm text-neutral-600">
                        {order.user.firstName} {order.user.lastName}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <strong className="block text-sm text-neutral-950">
                        {money(Number(order.total))}
                      </strong>

                      <span className="mt-1 block text-[10px] font-medium text-neutral-400 group-open:hidden">
                        View Details
                      </span>

                      <span className="mt-1 hidden text-[10px] font-medium text-neutral-400 group-open:block">
                        Hide Details
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-neutral-200 px-5 py-5 md:px-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Ship To
                      </span>

                      <strong className="mt-2 block text-sm text-neutral-900">
                        {order.shippingFirstName} {order.shippingLastName}
                      </strong>

                      <span className="mt-1 block text-sm leading-6 text-neutral-600">
                        {order.shippingAddress1}
                        {order.shippingAddress2 && (
                          <>
                            <br />
                            {order.shippingAddress2}
                          </>
                        )}
                        <br />
                        {order.shippingCity}, {order.shippingState}{" "}
                        {order.shippingPostalCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Customer
                      </span>

                      <strong className="mt-2 block text-sm text-neutral-900">
                        {order.user.firstName} {order.user.lastName}
                      </strong>

                      <span className="mt-1 block text-sm text-neutral-600">
                        {order.user.email}
                      </span>

                      {order.shippingPhone && (
                        <span className="mt-1 block text-sm text-neutral-600">
                          {order.shippingPhone}
                        </span>
                      )}

                      <span className="mt-3 inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-green-700">
                        {order.paymentMethod === "CASH" ? "COD" : "PAID"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Items
                      </span>

                      <div className="mt-2 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="min-w-0 text-neutral-600">
                              {item.productName}
                            </span>

                            <strong className="shrink-0 text-neutral-900">
                              x{item.quantity}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end border-t border-neutral-200 pt-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#b98b17]"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
