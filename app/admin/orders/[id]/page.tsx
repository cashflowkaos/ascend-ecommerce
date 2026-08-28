import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Box,
  Mail,
  MapPin,
  Package,
  Phone,
  UserRound,
  Trash2,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { deleteAdminOrder, markOrderPaid } from "../actions";
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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
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

  const totalUnits = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-[#D4A11E]"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            ORDER REQUEST
          </span>

          <h1>{order.orderNumber}</h1>

          <p>
            Submitted {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            {order.paymentStatus}
          </span>

          {order.paymentStatus !== "PAID" &&
            order.status !== "CONFIRMED" && (
              <ConfirmDelete action={deleteAdminOrder} message="Delete this order? This cannot be undone.">
                <input
                  type="hidden"
                  name="orderId"
                  value={order.id}
                />

                <button
                  type="submit"
                  title="Delete Order"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete Order
                </button>
              </ConfirmDelete>
            )}

        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
            <Package size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Units
            </span>

            <strong className="mt-1 block text-2xl">
              {totalUnits}
            </strong>
          </div>
        </article>

        <article className="admin-panel flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
            <Box size={19} />
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Line Items
            </span>

            <strong className="mt-1 block text-2xl">
              {order.items.length}
            </strong>
          </div>
        </article>

        <article className="admin-panel flex items-center gap-4 p-5">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
              Merchandise
            </span>

            <strong className="mt-1 block text-2xl">
              {money(Number(order.subtotal))}
            </strong>
          </div>
        </article>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">

        <div className="space-y-6">

          <section className="admin-panel overflow-hidden">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-eyebrow">
                  ITEMS
                </span>

                <h2>Order Contents</h2>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-left">
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Product
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      SKU
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Qty
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Unit Price
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-neutral-100 last:border-b-0"
                    >
                      <td className="px-5 py-5">
                        <strong className="block text-sm">
                          {item.productName}
                        </strong>

                        <span className="mt-1 block text-xs text-neutral-400">
                          {item.strength}
                        </span>

                        {item.variant && (
                          <span className="mt-1 block text-[11px] text-neutral-400">
                            Current inventory:{" "}
                            {item.variant.inventoryQty}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5 text-sm text-neutral-500">
                        {item.sku ?? "—"}
                      </td>

                      <td className="px-5 py-5 text-sm font-medium">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-5 text-sm">
                        {money(Number(item.unitPrice))}
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-semibold">
                        {money(Number(item.lineTotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-neutral-100 md:hidden">
              {order.items.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <strong className="block text-sm font-medium text-neutral-950">
                        {item.productName}
                      </strong>

                      <span className="mt-1 block text-xs text-neutral-400">
                        {item.strength}
                      </span>

                      {item.variant && (
                        <span className="mt-1 block text-[11px] text-neutral-400">
                          Current inventory:{" "}
                          {item.variant.inventoryQty}
                        </span>
                      )}
                    </div>

                    <strong className="shrink-0 text-sm text-neutral-950">
                      {money(Number(item.lineTotal))}
                    </strong>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        SKU
                      </span>
                      <span className="ml-2 text-xs text-neutral-600">
                        {item.sku ?? "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Qty
                      </span>
                      <span className="ml-2 text-xs font-medium text-neutral-900">
                        {item.quantity}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Unit
                      </span>
                      <span className="ml-2 text-xs text-neutral-600">
                        {money(Number(item.unitPrice))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50/50 px-5 py-5">
              <div className="ml-auto max-w-[340px] space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Merchandise
                  </span>

                  <strong>
                    {money(Number(order.subtotal))}
                  </strong>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Shipping
                  </span>

                  <span className="text-neutral-500">
                    To be confirmed
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Tax
                  </span>

                  <span className="text-neutral-500">
                    Not collected online
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-neutral-200 pt-3">
                  <span className="font-medium">
                    Request Total
                  </span>

                  <strong className="text-lg">
                    {money(Number(order.total))}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {(order.customerNote || order.adminNote) && (
            <section className="admin-panel p-6">
              <span className="admin-eyebrow">
                NOTES
              </span>

              <h2 className="mt-1 text-lg font-semibold">
                Order Notes
              </h2>

              {order.customerNote && (
                <div className="mt-5">
                  <strong className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                    Customer Note
                  </strong>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                    {order.customerNote}
                  </p>
                </div>
              )}

              {order.adminNote && (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <strong className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                    Admin Note
                  </strong>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                    {order.adminNote}
                  </p>
                </div>
              )}
            </section>
          )}

        </div>

        <div className="space-y-6">

          <section className="admin-panel p-6">
            <span className="admin-eyebrow">
              MEMBER
            </span>

            <h2 className="mt-1 text-lg font-semibold">
              Customer
            </h2>

            <div className="mt-5 flex gap-3">
              <UserRound
                size={18}
                className="mt-0.5 shrink-0 text-[#D4A11E]"
              />

              <div>
                <strong className="block text-sm">
                  {order.user.firstName}{" "}
                  {order.user.lastName}
                </strong>

                <a
                  href={`mailto:${order.user.email}`}
                  className="mt-2 flex items-center gap-2 text-xs text-neutral-500 transition hover:text-[#D4A11E]"
                >
                  <Mail size={13} />
                  {order.user.email}
                </a>

                {order.user.phone && (
                  <a
                    href={`tel:${order.user.phone}`}
                    className="mt-2 flex items-center gap-2 text-xs text-neutral-500 transition hover:text-[#D4A11E]"
                  >
                    <Phone size={13} />
                    {order.user.phone}
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="admin-panel p-6">
            <span className="admin-eyebrow">
              FULFILLMENT
            </span>

            <h2 className="mt-1 text-lg font-semibold">
              Shipping Address
            </h2>

            <div className="mt-5 flex gap-3">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-[#D4A11E]"
              />

              <address className="not-italic text-sm leading-6 text-neutral-600">
                <strong className="block text-neutral-950">
                  {order.shippingFirstName}{" "}
                  {order.shippingLastName}
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
                  {order.shippingCity},{" "}
                  {order.shippingState}{" "}
                  {order.shippingPostalCode}
                </span>

                <span className="block">
                  {order.shippingCountry}
                </span>

                {order.shippingPhone && (
                  <span className="mt-2 block">
                    {order.shippingPhone}
                  </span>
                )}
              </address>
            </div>
          </section>

          {order.paymentStatus !== "PAID" &&
            order.status !== "CANCELLED" && (
              <section className="admin-panel p-6">
                <span className="admin-eyebrow">
                  ORDER ACTION
                </span>

                <h2 className="mt-1 text-lg font-semibold">
                  Record Payment
                </h2>

                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Use this after payment has been received and verified.
                  Recording payment will confirm the order and deduct
                  the ordered quantities from variant inventory.
                </p>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <strong className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">
                    Inventory Action
                  </strong>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    This action records the products as sold. Only
                    click after payment has actually been received.
                  </p>
                </div>

                <form
                  action={markOrderPaid}
                  className="mt-5"
                >
                  <input
                    type="hidden"
                    name="orderId"
                    value={order.id}
                  />

                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#b98b17]"
                  >
                    Mark Paid & Confirm Order
                  </button>
                </form>
              </section>
            )}

          <section className="admin-panel p-6">
            <span className="admin-eyebrow">
              PAYMENT
            </span>

            <h2 className="mt-1 text-lg font-semibold">
              Payment & Fulfillment
            </h2>

            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Payment and shipping are coordinated directly
              with the member after the order request is received.
            </p>

            <div className="mt-5 border-t border-neutral-200 pt-5">
              <span className="text-xs text-neutral-400">
                Current payment status
              </span>

              <strong className="mt-1 block text-sm">
                {order.paymentStatus}
              </strong>
            </div>

            {order.trackingNumber && (
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <span className="text-xs text-neutral-400">
                  Tracking Number
                </span>

                <strong className="mt-1 block text-sm">
                  {order.trackingNumber}
                </strong>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
