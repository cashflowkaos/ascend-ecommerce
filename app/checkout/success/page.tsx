import Link from "next/link";
import {
  Check,
  ClipboardCheck,
  PackageCheck,
  UserRound,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrderRequestSuccessPage({
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

  const { order } = await searchParams;

  const orderNumber =
    typeof order === "string" &&
    order.trim().length > 0
      ? order.trim()
      : null;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">

        <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm sm:rounded-[34px]">

          <div className="px-6 py-10 text-center sm:px-10 sm:py-14 lg:px-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
              <Check size={30} strokeWidth={2} />
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4A11E]">
              Order Request Received
            </p>

            <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">
              Thank You
            </h1>

            <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-neutral-500 sm:text-base">
              Your order request has been successfully received by Ascend.
              An Ascend representative will contact you to coordinate
              payment and confirm fulfillment details.
            </p>

            {orderNumber && (
              <div className="mx-auto mt-7 max-w-[420px] rounded-[18px] border border-neutral-200 bg-neutral-50 px-5 py-4">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Order Request Number
                </span>

                <strong className="mt-1 block text-lg font-semibold tracking-[0.04em] text-neutral-950">
                  {orderNumber}
                </strong>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-8 sm:px-10 sm:py-10 lg:px-14">

            <h2 className="text-center text-lg font-medium">
              What Happens Next
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">

              <div className="rounded-[20px] border border-neutral-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                  <ClipboardCheck
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A11E]">
                  Step 01
                </span>

                <strong className="mt-1 block text-sm font-semibold">
                  Request Received
                </strong>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Your order details have been submitted to Ascend
                  for review.
                </p>
              </div>

              <div className="rounded-[20px] border border-neutral-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                  <UserRound
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A11E]">
                  Step 02
                </span>

                <strong className="mt-1 block text-sm font-semibold">
                  Ascend Will Contact You
                </strong>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  A representative will coordinate payment and
                  confirm fulfillment details with you.
                </p>
              </div>

              <div className="rounded-[20px] border border-neutral-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                  <PackageCheck
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A11E]">
                  Step 03
                </span>

                <strong className="mt-1 block text-sm font-semibold">
                  Order Processing
                </strong>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Once payment and fulfillment are confirmed,
                  your order will move into processing.
                </p>
              </div>

            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {memberMode && (
                <Link
                  href="/account"
                  className="flex min-h-12 items-center justify-center rounded-full bg-[#D4A11E] px-7 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#b98b17]"
                >
                  My Account
                </Link>
              )}

              <Link
                href="/compounds"
                className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:border-[#D4A11E] hover:text-[#D4A11E]"
              >
                Continue Browsing
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] leading-5 text-neutral-400">
              Submission of an order request does not constitute payment
              or final fulfillment confirmation.
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}