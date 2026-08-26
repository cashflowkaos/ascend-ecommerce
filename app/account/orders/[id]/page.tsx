import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CreditCard,
  LogOut,
  MapPin,
  Package,
  Truck,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { memberSignOut } from "../../actions";

export const dynamic = "force-dynamic";

function formatMoney(value: {
  toString(): string;
}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value.toString()));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default async function MemberOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireUser();

  if (currentUser.role === "ADMIN") {
    redirect("/admin");
  }

  if (
    currentUser.status !== "APPROVED" ||
    currentUser.mustChangePassword
  ) {
    redirect("/account");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: currentUser.id,
    },

    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="member-account-page">
      <div className="member-account-shell">
        <header className="member-account-header">
          <Link
            href="/"
            className="member-account-brand"
          >
            <Image
              src="/logo/wordmark.png"
              alt="Ascend Peptide Co."
              width={250}
              height={95}
              priority
              className="member-account-logo"
            />
          </Link>

          <div className="member-account-header-actions">
            <Link
              href="/account"
              className="member-header-link"
            >
              My Account
            </Link>

            <form action={memberSignOut}>
              <button
                type="submit"
                className="member-header-link member-signout"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="mb-7">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-[#D4A11E]"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>

        <section className="member-account-hero">
          <div>
            <span className="admin-eyebrow">
              ORDER DETAILS
            </span>

            <h1>{order.orderNumber}</h1>

            <p>
              Submitted{" "}
              {order.createdAt.toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="member-approved-badge">
              {formatStatus(order.status)}
            </span>

            <span className="member-approved-badge">
              {formatStatus(order.paymentStatus)}
            </span>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
          <section className="space-y-6">
            <article className="member-account-card">
              <div className="member-account-card-heading">
                <div>
                  <span className="admin-eyebrow">
                    ITEMS
                  </span>

                  <h2>Order Summary</h2>
                </div>

                <Package size={19} />
              </div>

              <div className="mt-5 divide-y divide-neutral-200">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-5 py-5 first:pt-0 last:pb-0"
                  >
                    <div>
                      <strong className="text-sm text-neutral-950">
                        {item.productName}
                      </strong>

                      <p className="mt-1 text-xs text-neutral-500">
                        {item.strength}
                        {item.sku
                          ? ` · ${item.sku}`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Qty {item.quantity} ×{" "}
                        {formatMoney(item.unitPrice)}
                      </p>
                    </div>

                    <strong className="shrink-0 text-sm text-neutral-950">
                      {formatMoney(item.lineTotal)}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="member-account-card">
              <div className="member-account-card-heading">
                <div>
                  <span className="admin-eyebrow">
                    SHIPPING
                  </span>

                  <h2>Delivery Information</h2>
                </div>

                <MapPin size={19} />
              </div>

              <div className="member-address-preview">
                <strong>
                  {order.shippingFirstName}{" "}
                  {order.shippingLastName}
                </strong>

                {order.shippingCompany && (
                  <span>
                    {order.shippingCompany}
                  </span>
                )}

                <span>
                  {order.shippingAddress1}
                </span>

                {order.shippingAddress2 && (
                  <span>
                    {order.shippingAddress2}
                  </span>
                )}

                <span>
                  {order.shippingCity},{" "}
                  {order.shippingState}{" "}
                  {order.shippingPostalCode}
                </span>

                <span>
                  {order.shippingCountry}
                </span>

                {order.shippingPhone && (
                  <span>
                    {order.shippingPhone}
                  </span>
                )}
              </div>
            </article>

            {order.trackingNumber && (
              <article className="member-account-card">
                <div className="member-account-card-heading">
                  <div>
                    <span className="admin-eyebrow">
                      FULFILLMENT
                    </span>

                    <h2>Tracking</h2>
                  </div>

                  <Truck size={19} />
                </div>

                <p className="mt-4 text-sm font-medium text-neutral-900">
                  {order.trackingNumber}
                </p>
              </article>
            )}
          </section>

          <aside className="space-y-6">
            <article className="member-account-card">
              <div className="member-account-card-heading">
                <div>
                  <span className="admin-eyebrow">
                    TOTAL
                  </span>

                  <h2>Order Total</h2>
                </div>

                <CreditCard size={19} />
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Subtotal
                  </span>

                  <span>
                    {formatMoney(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Shipping
                  </span>

                  <span>
                    {formatMoney(
                      order.shippingAmount
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Tax
                  </span>

                  <span>
                    {formatMoney(order.taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-neutral-200 pt-4">
                  <strong>Total</strong>

                  <strong className="text-xl">
                    {formatMoney(order.total)}
                  </strong>
                </div>
              </div>
            </article>

            <article className="member-account-card">
              <div className="member-account-card-heading">
                <div>
                  <span className="admin-eyebrow">
                    STATUS
                  </span>

                  <h2>Order Progress</h2>
                </div>

                <Box size={19} />
              </div>

              <div className="member-account-detail-list">
                <div>
                  <span>Order</span>
                  <strong>
                    {formatStatus(order.status)}
                  </strong>
                </div>

                <div>
                  <span>Payment</span>
                  <strong>
                    {formatStatus(
                      order.paymentStatus
                    )}
                  </strong>
                </div>

                {order.shippedAt && (
                  <div>
                    <span>Shipped</span>
                    <strong>
                      {order.shippedAt.toLocaleDateString(
                        "en-US"
                      )}
                    </strong>
                  </div>
                )}

                {order.completedAt && (
                  <div>
                    <span>Completed</span>
                    <strong>
                      {order.completedAt.toLocaleDateString(
                        "en-US"
                      )}
                    </strong>
                  </div>
                )}
              </div>
            </article>

            {order.customerNote && (
              <article className="member-account-card">
                <span className="admin-eyebrow">
                  ORDER NOTE
                </span>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                  {order.customerNote}
                </p>
              </article>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}