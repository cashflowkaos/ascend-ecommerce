import Link from "next/link";
import {
  Banknote,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  const amount = Number(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatPickupTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(value);
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    order?: string;
  }>;
}) {
  const user = await getCurrentUser();

  const memberMode =
    user?.role === "MEMBER" &&
    user.status === "APPROVED" &&
    !user.mustChangePassword;

  if (!user || !memberMode) {
    redirect("/login");
  }

  const { order: orderParam } = await searchParams;

  const orderNumber =
    typeof orderParam === "string"
      ? orderParam.trim()
      : "";

  if (!orderNumber) {
    redirect("/account");
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: user.id,
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      fulfillmentMethod: true,
      paymentMethod: true,
      paymentStatus: true,
      pickupScheduledAt: true,
      createdAt: true,
    },
  });

  if (!order) {
    redirect("/account");
  }

  const isPickup =
    order.fulfillmentMethod === "PICKUP";

  const isZelle =
    order.paymentMethod === "ZELLE";

  const isPaid =
    order.paymentStatus === "PAID";

  let statusTitle = "Order Confirmed";
  let statusText =
    "Your order has been received by Ascend and is now in our system.";

  if (isPickup && order.paymentMethod === "CASH") {
    statusText =
      "Your pickup is scheduled. Payment will be collected when you pick up your order.";
  } else if (isPickup && isZelle && !isPaid) {
    statusText =
      "Your pickup is scheduled and your Zelle confirmation was submitted. Payment verification is pending.";
  } else if (!isPickup && isZelle && !isPaid) {
    statusText =
      "Your order has been received and your Zelle confirmation was submitted. Shipping will proceed after payment verification.";
  } else if (!isPickup && isPaid) {
    statusText =
      "Your payment is verified and your order is being prepared for shipping.";
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm sm:rounded-[34px]">
          <div className="px-6 py-10 text-center sm:px-10 sm:py-14 lg:px-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
              <Check size={30} strokeWidth={2} />
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4A11E]">
              Order Confirmed
            </p>

            <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">
              Thank You
            </h1>

            <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-neutral-500 sm:text-base">
              {statusText}
            </p>

            <div className="mx-auto mt-7 grid max-w-[560px] gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-5 py-4">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Order Number
                </span>

                <strong className="mt-1 block text-base font-semibold tracking-[0.03em] text-neutral-950">
                  {order.orderNumber}
                </strong>
              </div>

              <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-5 py-4">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Order Total
                </span>

                <strong className="mt-1 block text-lg font-semibold text-neutral-950">
                  {money(order.total)}
                </strong>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
            <h2 className="text-center text-lg font-medium">
              Order Details
            </h2>

            <div className="mx-auto mt-7 grid max-w-[700px] gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-neutral-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                  {isPickup ? (
                    <MapPin size={19} strokeWidth={1.8} />
                  ) : (
                    <Truck size={19} strokeWidth={1.8} />
                  )}
                </div>

                <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A11E]">
                  Fulfillment
                </span>

                <strong className="mt-1 block text-sm font-semibold">
                  {isPickup ? "Pickup" : "Shipping"}
                </strong>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {isPickup && order.pickupScheduledAt
                    ? formatPickupTime(
                        order.pickupScheduledAt
                      )
                    : isPickup
                      ? "Pickup scheduling confirmed with your order."
                      : "Your order will be shipped after payment verification."}
                </p>
              </div>

              <div className="rounded-[20px] border border-neutral-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                  {order.paymentMethod === "CASH" ? (
                    <Banknote
                      size={19}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <CreditCard
                      size={19}
                      strokeWidth={1.8}
                    />
                  )}
                </div>

                <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A11E]">
                  Payment
                </span>

                <strong className="mt-1 block text-sm font-semibold">
                  {order.paymentMethod === "CASH"
                    ? "Cash at Pickup"
                    : "Zelle"}
                </strong>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {order.paymentMethod === "CASH"
                    ? "Payment will be collected when you pick up your order."
                    : isPaid
                      ? "Your Zelle payment has been verified."
                      : "Your Zelle confirmation was submitted and is pending verification."}
                </p>
              </div>
            </div>

            {isPickup && order.pickupScheduledAt && (
              <div className="mx-auto mt-4 flex max-w-[700px] items-start gap-3 rounded-[18px] border border-[#D4A11E]/25 bg-[#D4A11E]/5 px-5 py-4">
                <Clock3
                  size={18}
                  className="mt-0.5 shrink-0 text-[#D4A11E]"
                />

                <div>
                  <strong className="block text-sm font-semibold">
                    Your Pickup Time
                  </strong>

                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {formatPickupTime(
                      order.pickupScheduledAt
                    )}
                  </p>

                  <div className="mt-4 border-t border-[#D4A11E]/20 pt-4">
                    <strong className="block text-sm font-semibold">
                      Pickup Location
                    </strong>

                    <p className="mt-1 text-xs leading-5 text-neutral-600">
                      Your pickup location will be confirmed by Ascend
                      and sent to your email. It will also be available
                      in My Account → Orders once confirmed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mx-auto mt-4 flex max-w-[700px] items-start gap-3 rounded-[18px] border border-neutral-200 bg-white px-5 py-4">
              <PackageCheck
                size={18}
                className="mt-0.5 shrink-0 text-[#D4A11E]"
              />

              <div>
                <strong className="block text-sm font-semibold">
                  Confirmation Sent
                </strong>

                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  We sent your order confirmation to{" "}
                  <span className="font-medium text-neutral-700">
                    {user.email}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/account"
                className="flex min-h-12 items-center justify-center rounded-full bg-[#D4A11E] px-7 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#b98b17]"
              >
                My Account
              </Link>

              <Link
                href="/compounds"
                className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:border-[#D4A11E] hover:text-[#D4A11E]"
              >
                Continue Browsing
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] leading-5 text-neutral-400">
              Keep your order number for your records.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}