import Link from "next/link";
import {
  Clock3,
  DollarSign,
  Eye,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

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

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
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
              Total Orders
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

        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
            <DollarSign size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Merchandise Value
            </span>

            <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
              {money(merchandiseValue)}
            </strong>
          </div>
        </article>
      </section>

      <section className="admin-panel mt-6 overflow-hidden">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              ORDER QUEUE
            </span>

            <h2>Order Requests</h2>
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
          <div className="overflow-x-auto">
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
                          {order.paymentStatus}
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
        )}
      </section>
    </div>
  );
}