import Link from "next/link";
import { Plus } from "lucide-react";
import BackOfficeCustomerDirectory from "@/components/backoffice/BackOfficeCustomerDirectory";
import { prisma } from "@/lib/prisma";

export default async function BackOfficeCustomersPage() {
  const customers = await prisma.backOfficeCustomer.findMany({
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      email: true,
      phone: true,
      pricingType: true,
      active: true,
      userId: true,
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
    ["TIER_1", "TIER_2", "TIER_3"].includes(
      customer.pricingType
    )
  ).length;

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            CUSTOMERS
          </span>

          <h1>Customers</h1>

          <p>
            Unified customer records for website members,
            walk-ins, wholesale, and distro clients.
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
          <strong>
            {wholesaleCustomers + tierCustomers}
          </strong>
        </div>
      </div>

      <BackOfficeCustomerDirectory
        customers={customers}
      />
    </>
  );
}
