import Link from "next/link";
import { ArrowLeft, CreditCard, MapPin, Truck } from "lucide-react";
import { requireApprovedMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const currentUser = await requireApprovedMember();

  const member = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      addresses: {
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          id: true,
          label: true,
          firstName: true,
          lastName: true,
          company: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          isDefault: true,
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  const shippingAddress =
    member.addresses.find((address) => address.isDefault) ??
    member.addresses[0] ??
    null;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-[#D4A11E]"
        >
          <ArrowLeft size={18} />
          Back to Cart
        </Link>

        <div className="mt-6 sm:mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4A11E]">
            Member Order
          </p>

          <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Confirm your shipping information and review your order
            before submitting.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-8">
          <div className="grid gap-6">
          <section className="rounded-[24px] border border-neutral-200 bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                  <MapPin size={19} strokeWidth={1.8} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4A11E]">
                    Shipping
                  </p>

                  <h2 className="mt-1 text-xl font-medium">
                    Shipping Address
                  </h2>
                </div>
              </div>

              <Link
                href="/account/profile"
                className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:text-[#D4A11E]"
              >
                Manage
              </Link>
            </div>

            {shippingAddress ? (
              <div className="mt-7 rounded-[18px] border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <strong className="text-base font-semibold text-neutral-950">
                    {shippingAddress.firstName}{" "}
                    {shippingAddress.lastName}
                  </strong>

                  {shippingAddress.isDefault && (
                    <span className="rounded-full bg-[#D4A11E]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7415]">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-1 text-sm leading-6 text-neutral-600">
                  {shippingAddress.company && (
                    <span>{shippingAddress.company}</span>
                  )}

                  <span>{shippingAddress.address1}</span>

                  {shippingAddress.address2 && (
                    <span>{shippingAddress.address2}</span>
                  )}

                  <span>
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.postalCode}
                  </span>

                  <span>{shippingAddress.country}</span>

                  {(shippingAddress.phone || member.phone) && (
                    <span className="mt-2">
                      {shippingAddress.phone ?? member.phone}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-7 rounded-[18px] border border-amber-200 bg-amber-50 p-5">
                <strong className="text-sm font-semibold text-neutral-950">
                  Shipping address required
                </strong>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Add a shipping address to your member profile before
                  submitting an order.
                </p>

                <Link
                  href="/account/profile"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#b98b17]"
                >
                  Add Shipping Address
                </Link>
              </div>
            )}

            <div className="mt-6 border-t border-neutral-200 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Contact
              </p>

              <p className="mt-2 text-sm font-medium text-neutral-900">
                {member.firstName} {member.lastName}
              </p>

              <p className="mt-1 text-sm text-neutral-600">
                {member.email}
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-neutral-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                <Truck size={19} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4A11E]">
                  Delivery
                </p>

                <h2 className="mt-1 text-xl font-medium">
                  Shipping Method
                </h2>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between gap-5 rounded-[18px] border-2 border-[#D4A11E] bg-[#D4A11E]/5 p-5">
              <div>
                <strong className="text-sm font-semibold text-neutral-950">
                  Standard Shipping
                </strong>

                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Shipping arrangements and delivery details will be confirmed
                  by an Ascend representative after your order request is received.
                </p>
              </div>

              <strong className="shrink-0 text-right text-xs font-medium text-neutral-500">
                Confirmed After Submission
              </strong>
            </div>
          </section>

          <section className="rounded-[24px] border border-neutral-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4A11E]/10 text-[#D4A11E]">
                <CreditCard size={19} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4A11E]">
                  Payment
                </p>

                <h2 className="mt-1 text-xl font-medium">
                  Order Request Payment
                </h2>
              </div>
            </div>

            <div className="mt-7 rounded-[18px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500">
                  <CreditCard size={19} strokeWidth={1.7} />
                </div>

                <div>
                  <strong className="text-sm font-semibold text-neutral-950">
                    Payment Coordinated After Submission
                  </strong>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                    No payment is collected online when you submit your order request.
                    An Ascend representative will contact you to coordinate payment
                    and fulfillment after your request is received.
                  </p>
                </div>
              </div>
            </div>
          </section>

          </div>

          <aside className="rounded-[24px] border border-neutral-200 bg-white p-6 sm:p-8 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4A11E]">
              Order Summary
            </p>

            <h2 className="mt-2 text-xl font-medium">
              Review Your Order
            </h2>

            <CheckoutOrderSummary />
          </aside>
        </div>
      </div>
    </main>
  );
}