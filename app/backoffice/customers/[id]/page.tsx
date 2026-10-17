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
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            invoiceNumber: true,
            source: true,
            status: true,
            locationCode: true,
            total: true,
            amountPaid: true,
            balanceDue: true,
            createdAt: true,
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

  const activeInvoices = customer.invoices.filter(
    (invoice) => invoice.status !== "VOID"
  );

  const totalSpent = activeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  const totalPaid = activeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amountPaid),
    0
  );

  const balanceDue = activeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balanceDue),
    0
  );

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const formatDate = (value: Date) =>
    value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

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

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Total Spent</span>
          <strong>{formatMoney(totalSpent)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Total Paid</span>
          <strong>{formatMoney(totalPaid)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Balance Due</span>
          <strong>{formatMoney(balanceDue)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Invoices</span>
          <strong>{customer.invoices.length}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              INVOICE HISTORY
            </span>
            <h2>Customer Invoices</h2>
          </div>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Source</th>
                <th>Status</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
              </tr>
            </thead>

            <tbody>
              {customer.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      href={`/backoffice/sales/${invoice.id}`}
                    >
                      <strong>{invoice.invoiceNumber}</strong>
                    </Link>
                  </td>

                  <td>{formatDate(invoice.createdAt)}</td>

                  <td>
                    {invoice.source === "LEGACY_IMPORT"
                      ? "Legacy"
                      : invoice.source === "WEBSITE"
                        ? "Website"
                        : "POS"}
                  </td>

                  <td>
                    {invoice.status === "COMPLETED"
                      ? "Completed"
                      : invoice.status === "OPEN"
                        ? "Open"
                        : "Void"}
                  </td>

                  <td>{formatMoney(Number(invoice.total))}</td>

                  <td>
                    {formatMoney(Number(invoice.amountPaid))}
                  </td>

                  <td>
                    {formatMoney(Number(invoice.balanceDue))}
                  </td>
                </tr>
              ))}

              {customer.invoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    No invoices are attached to this customer.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
