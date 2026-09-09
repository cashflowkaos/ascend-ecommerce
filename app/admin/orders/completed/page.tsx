import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye } from "lucide-react";

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

export default async function CompletedOrdersPage() {
  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
    },
    orderBy: {
      completedAt: "desc",
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

  const completedValue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-[#D4A11E]"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
      </div>

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            ORDER HISTORY
          </span>

          <h1>Completed Orders</h1>

          <p>
            Review completed customer orders and historical order value.
          </p>
        </div>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Completed Orders
            </span>

            <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
              {orders.length}
            </strong>
          </div>
        </article>

        <article className="admin-panel p-5">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
            Completed Value
          </span>

          <strong className="mt-1 block text-2xl font-semibold text-neutral-950">
            {money(completedValue)}
          </strong>
        </article>
      </section>

      <section className="admin-panel overflow-hidden">
        <div className="admin-panel-heading">
          <h2 className="text-xl font-semibold text-[#D4A11E]">
            Completed Orders
          </h2>

          <span className="admin-member-total">
            {orders.length} total
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-neutral-500">
            No completed orders yet.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-left">
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Order
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Completed
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Items
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Value
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
                          <strong className="block text-sm font-medium text-neutral-900">
                            {order.user.firstName} {order.user.lastName}
                          </strong>

                          <span className="mt-1 block text-xs text-neutral-400">
                            {order.user.email}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-sm text-neutral-500">
                          {formatDate(order.completedAt ?? order.updatedAt)}
                        </td>

                        <td className="px-5 py-5 text-sm font-medium text-neutral-700">
                          {itemCount}
                        </td>

                        <td className="px-5 py-5 text-sm font-semibold text-neutral-950">
                          {money(Number(order.total))}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${paymentStatusClasses(
                              order.paymentStatus
                            )}`}
                          >
                            {order.paymentStatus === "PAID" &&
                            order.paymentMethod === "CASH"
                              ? "COD"
                              : order.paymentStatus}
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
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B1841A]">
                          Order
                        </span>

                        <strong className="mt-1 block text-base font-semibold text-neutral-950">
                          {order.orderNumber}
                        </strong>
                      </div>

                      <span className="text-sm font-medium text-neutral-400">
                        {"View >"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <strong className="block text-sm font-medium text-neutral-900">
                        {order.user.firstName} {order.user.lastName}
                      </strong>

                      <span className="mt-1 block text-xs text-neutral-400">
                        {order.user.email}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Completed
                        </span>
                        <span className="mt-1 block text-xs text-neutral-600">
                          {formatDate(order.completedAt ?? order.updatedAt)}
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
                          Value
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-neutral-950">
                          {money(Number(order.total))}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Payment
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-neutral-700">
                          {order.paymentStatus === "PAID" &&
                          order.paymentMethod === "CASH"
                            ? "COD"
                            : order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}