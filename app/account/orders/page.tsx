import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  LogOut,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { memberSignOut } from "../actions";

export const dynamic = "force-dynamic";

const CURRENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
] as const;

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

export default async function MemberOrdersPage() {
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

  const orders = await prisma.order.findMany({
    where: {
      userId: currentUser.id,
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,
      trackingNumber: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  const currentOrders = orders.filter((order) =>
    CURRENT_STATUSES.includes(
      order.status as (typeof CURRENT_STATUSES)[number]
    )
  );

  const pastOrders = orders.filter(
    (order) =>
      !CURRENT_STATUSES.includes(
        order.status as (typeof CURRENT_STATUSES)[number]
      )
  );

  const orderCard = (
    order: (typeof orders)[number]
  ) => (
    <Link
      key={order.id}
      href={`/account/orders/${order.id}`}
      className="group block rounded-[24px] border border-neutral-200 bg-white p-5 transition hover:border-[#D4A11E] sm:p-6"
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Order
          </span>

          <h3 className="mt-1 text-base font-semibold text-neutral-950">
            {order.orderNumber}
          </h3>

          <p className="mt-1 text-xs text-neutral-500">
            {order.createdAt.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            )}
            {" · "}
            {order._count.items}{" "}
            {order._count.items === 1
              ? "item"
              : "items"}
          </p>
        </div>

        <ChevronRight
          size={19}
          className="shrink-0 text-neutral-400 transition group-hover:text-[#D4A11E]"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-neutral-100 pt-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
            {formatStatus(order.status)}
          </span>

          <span className="rounded-full bg-[#D4A11E]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9a7312]">
            {formatStatus(order.paymentStatus)}
          </span>
        </div>

        <strong className="text-lg text-neutral-950">
          {formatMoney(order.total)}
        </strong>
      </div>

      {order.trackingNumber && (
        <p className="mt-3 text-xs text-neutral-500">
          Tracking: {order.trackingNumber}
        </p>
      )}
    </Link>
  );

  return (
    <main className="member-account-page">
      <div className="member-account-shell">
        <header className="member-account-header">
          <Link
            href="/"
            className="member-account-brand"
          >
            <Image
              src="/logo/logo.png"
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


        <section className="member-account-hero">
          <div>
            <span className="admin-eyebrow">
              MEMBER ORDERS
            </span>

            <h1>Orders</h1>

            <p>
              Review current orders, previous purchases
              and fulfillment status.
            </p>
          </div>

          <div className="member-approved-badge">
            {orders.length}{" "}
            {orders.length === 1
              ? "Order"
              : "Orders"}
          </div>
        </section>

        <div className="mt-8 space-y-10">
          <section>
            <div className="mb-5 flex items-center gap-3">
              <Clock3
                size={19}
                className="text-[#D4A11E]"
              />

              <div>
                <span className="admin-eyebrow">
                  ACTIVE
                </span>

                <h2 className="text-xl font-semibold text-neutral-950">
                  Current Orders
                </h2>
              </div>
            </div>

            {currentOrders.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {currentOrders.map(orderCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-7 text-sm text-neutral-500">
                You have no current orders.
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center gap-3">
              <PackageCheck
                size={19}
                className="text-[#D4A11E]"
              />

              <div>
                <span className="admin-eyebrow">
                  HISTORY
                </span>

                <h2 className="text-xl font-semibold text-neutral-950">
                  Past Orders
                </h2>
              </div>
            </div>

            {pastOrders.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {pastOrders.map(orderCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-7 text-sm text-neutral-500">
                You have no past orders.
              </div>
            )}
          </section>
        </div>

        {orders.length === 0 && (
          <div className="mt-8 text-center">
            <ShoppingBag
              size={28}
              className="mx-auto text-neutral-300"
            />

            <Link
              href="/compounds"
              className="member-primary-button mt-5 inline-flex"
            >
              Browse Member Catalog
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
