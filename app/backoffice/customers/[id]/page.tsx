import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import BackOfficeDeleteCustomerButton from "@/components/backoffice/BackOfficeDeleteCustomerButton";
import BackOfficeSaveButton from "@/components/backoffice/BackOfficeSaveButton";
import { prisma } from "@/lib/prisma";
import {
  deleteBackOfficeCustomer,
  setBackOfficeCustomerMemberLink,
  updateBackOfficeCustomer,
} from "../actions";

export const dynamic = "force-dynamic";

const pricingOptions = [
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "TIER_1", label: "Tier 1" },
  { value: "TIER_2", label: "Tier 2" },
  { value: "TIER_3", label: "Tier 3" },
] as const;

export default async function BackOfficeCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [customer, users] = await Promise.all([
    prisma.backOfficeCustomer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            distroEnabled: true,
            distroTier: true,
          },
        },
      },
    }),

    prisma.user.findMany({
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
        { email: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        distroEnabled: true,
        distroTier: true,
        backOfficeCustomer: {
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  if (!customer) {
    notFound();
  }

  const availableUsers = users.filter(
    (user) =>
      !user.backOfficeCustomer ||
      user.backOfficeCustomer.id === customer.id
  );

  const customerName =
    `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            CUSTOMERS / CUSTOMER
          </span>

          <h1>{customerName}</h1>

          <p>
            Manage customer information, pricing, and website
            membership.
          </p>
        </div>

        <Link
          href="/backoffice/customers"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Customers
        </Link>
      </div>

      <form
        action={updateBackOfficeCustomer}
        className="backoffice-panel backoffice-product-form"
      >
        <input type="hidden" name="id" value={customer.id} />

        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              CUSTOMER DETAILS
            </span>
            <h2>Customer Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>First Name</span>
            <input
              type="text"
              name="firstName"
              defaultValue={customer.firstName}
              autoComplete="off"
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Last Name</span>
            <input
              type="text"
              name="lastName"
              defaultValue={customer.lastName}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Company</span>
            <input
              type="text"
              name="company"
              defaultValue={customer.company ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Pricing</span>
            <select
              name="pricingType"
              defaultValue={customer.pricingType}
            >
              {pricingOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="backoffice-form-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              defaultValue={customer.email ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Phone</span>
            <input
              type="text"
              name="phone"
              defaultValue={customer.phone ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={customer.notes ?? ""}
            />
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/customers"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <BackOfficeSaveButton />
        </div>
      </form>

      {customer.legacyCustomerId === null ? (
        <form
          action={deleteBackOfficeCustomer}
          className="backoffice-form-actions"
        >
          <input
            type="hidden"
            name="id"
            value={customer.id}
          />
          <BackOfficeDeleteCustomerButton />
        </form>
      ) : null}

      <form
        action={setBackOfficeCustomerMemberLink}
        className="backoffice-panel backoffice-product-form"
      >
        <input
          type="hidden"
          name="customerId"
          value={customer.id}
        />

        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              WEBSITE MEMBERSHIP
            </span>
            <h2>Linked Website Member</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Website Account</span>

            <select
              name="userId"
              defaultValue={customer.userId ?? ""}
            >
              <option value="">
                No website account linked
              </option>

              {availableUsers.map((user) => {
                const name =
                  `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

                return (
                  <option key={user.id} value={user.id}>
                    {name || user.email} - {user.email}
                  </option>
                );
              })}
            </select>

            <small>
              Linking connects this customer record to the
              member's website login. It does not create a
              duplicate customer.
            </small>
          </label>
        </div>

        {customer.user ? (
          <div className="backoffice-form-grid">
            <div className="backoffice-form-field">
              <span>Current Member</span>
              <strong>
                {`${customer.user.firstName ?? ""} ${customer.user.lastName ?? ""}`.trim() ||
                  customer.user.email}
              </strong>
            </div>

            <div className="backoffice-form-field">
              <span>Member Distro Tier</span>
              <strong>
                {customer.user.distroEnabled
                  ? customer.user.distroTier ?? "Enabled"
                  : "Not enabled"}
              </strong>
            </div>
          </div>
        ) : null}

        <div className="backoffice-form-actions">
          <button
            type="submit"
            className="backoffice-primary-button"
          >
            Save Website Link
          </button>
        </div>
      </form>
    </>
  );
}
