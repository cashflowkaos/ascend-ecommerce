import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

const pricingLabels = {
  RETAIL: "Retail",
  WHOLESALE: "Wholesale",
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
} as const;

export default async function BackOfficeCustomersPage() {
  const customers = await prisma.backOfficeCustomer.findMany({
    orderBy: [
      { active: "desc" },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
    include: {
      user: {
        select: {
          email: true,
          distroEnabled: true,
          distroTier: true,
        },
      },
    },
  });

  const activeCustomers = customers.filter(
    (customer) => customer.active
  ).length;

  const linkedMembers = customers.filter(
    (customer) => customer.userId
  ).length;

  const wholesaleCustomers = customers.filter(
    (customer) => customer.pricingType === "WHOLESALE"
  ).length;

  const tierCustomers = customers.filter((customer) =>
    ["TIER_1", "TIER_2", "TIER_3"].includes(customer.pricingType)
  ).length;

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">CUSTOMERS</span>
          <h1>Customers</h1>
          <p>
            Unified customer records for website members, walk-ins,
            wholesale, and distro clients.
          </p>
        </div>

        <Link
          href="/backoffice/customers/new"
          className="backoffice-primary-button"
        >
          <Plus size={15} strokeWidth={2} />
          Add Customer
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Active</span>
          <strong>{activeCustomers}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Website Members</span>
          <strong>{linkedMembers}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Wholesale / Tier</span>
          <strong>{wholesaleCustomers + tierCustomers}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              CUSTOMER DIRECTORY
            </span>
            <h2>All Customers</h2>
          </div>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Pricing</th>
                <th>Website</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                    {customer.company ? (
                      <div>{customer.company}</div>
                    ) : null}
                  </td>

                  <td>
                    <div>{customer.email || "—"}</div>
                    <div>{customer.phone || "—"}</div>
                  </td>

                  <td>
                    {pricingLabels[customer.pricingType]}
                  </td>

                  <td>
                    {customer.userId ? "Linked" : "Not linked"}
                  </td>

                  <td>
                    {customer.active ? "Active" : "Inactive"}
                  </td>

                  <td>
                    <Link
                      href={`/backoffice/customers/${customer.id}`}
                      className="backoffice-table-action"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No customers have been added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
