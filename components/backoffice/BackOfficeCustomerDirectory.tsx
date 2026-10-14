"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CustomerRow = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  pricingType:
    | "RETAIL"
    | "WHOLESALE"
    | "TIER_1"
    | "TIER_2"
    | "TIER_3";
  active: boolean;
  userId: string | null;
};

const pricingLabels = {
  RETAIL: "Retail",
  WHOLESALE: "Wholesale",
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
} as const;

export default function BackOfficeCustomerDirectory({
  customers,
}: {
  customers: CustomerRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...customers]
      .filter((customer) => {
        if (!query) {
          return true;
        }

        const searchable = [
          customer.firstName,
          customer.lastName,
          `${customer.firstName} ${customer.lastName}`,
          customer.company ?? "",
          customer.email ?? "",
          customer.phone ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => {
        const firstNameCompare = a.firstName.localeCompare(
          b.firstName,
          undefined,
          { sensitivity: "base" }
        );

        if (firstNameCompare !== 0) {
          return firstNameCompare;
        }

        return a.lastName.localeCompare(
          b.lastName,
          undefined,
          { sensitivity: "base" }
        );
      });
  }, [customers, search]);

  function openCustomer(id: string) {
    router.push(`/backoffice/customers/${id}`);
  }

  return (
    <div className="backoffice-panel">
      <div className="backoffice-panel-heading">
        <div>
          <span className="backoffice-eyebrow">
            CUSTOMER DIRECTORY
          </span>
          <h2>All Customers</h2>
        </div>
      </div>

      <div
        style={{
          padding: "0 0 18px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, company, email, or phone..."
          autoComplete="off"
          style={{
            width: "100%",
            maxWidth: "480px",
            minHeight: "42px",
            padding: "0 13px",
          }}
        />

        <span style={{ whiteSpace: "nowrap" }}>
          {filteredCustomers.length}{" "}
          {filteredCustomers.length === 1
            ? "customer"
            : "customers"}
        </span>
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
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                role="link"
                tabIndex={0}
                onClick={() => openCustomer(customer.id)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openCustomer(customer.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
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
              </tr>
            ))}

            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {search
                    ? "No customers match your search."
                    : "No customers have been added yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
