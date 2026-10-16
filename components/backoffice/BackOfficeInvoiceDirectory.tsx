"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  source: "POS" | "WEBSITE" | "LEGACY_IMPORT";
  status: "OPEN" | "COMPLETED" | "VOID";
  customerFirstName: string;
  customerLastName: string;
  customerCompany: string | null;
  locationCode: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
};

const sourceLabels = {
  POS: "POS",
  WEBSITE: "Website",
  LEGACY_IMPORT: "Legacy",
} as const;

const statusLabels = {
  OPEN: "Open",
  COMPLETED: "Completed",
  VOID: "Void",
} as const;

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BackOfficeInvoiceDirectory({
  invoices,
}: {
  invoices: InvoiceRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (status !== "ALL" && invoice.status !== status) {
        return false;
      }

      if (source !== "ALL" && invoice.source !== source) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        invoice.invoiceNumber,
        invoice.customerFirstName,
        invoice.customerLastName,
        `${invoice.customerFirstName} ${invoice.customerLastName}`,
        invoice.customerCompany ?? "",
        invoice.locationCode,
        sourceLabels[invoice.source],
        statusLabels[invoice.status],
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [invoices, search, status, source]);

  function openInvoice(id: string) {
    router.push(`/backoffice/sales/${id}`);
  }

  return (
    <div className="backoffice-panel">
      <div className="backoffice-panel-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVOICE DIRECTORY
          </span>
          <h2>All Invoices</h2>
        </div>
      </div>

      <div
        style={{
          padding: "0 0 18px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search invoice, customer, or location..."
          autoComplete="off"
          style={{
            width: "100%",
            maxWidth: "420px",
            minHeight: "42px",
            padding: "0 13px",
          }}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{ minHeight: "42px", padding: "0 10px" }}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOID">Void</option>
        </select>

        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          style={{ minHeight: "42px", padding: "0 10px" }}
        >
          <option value="ALL">All Sources</option>
          <option value="POS">POS</option>
          <option value="WEBSITE">Website</option>
          <option value="LEGACY_IMPORT">Legacy</option>
        </select>

        <span style={{ whiteSpace: "nowrap" }}>
          {filteredInvoices.length}{" "}
          {filteredInvoices.length === 1
            ? "invoice"
            : "invoices"}
        </span>
      </div>

      <div className="backoffice-table-wrap">
        <table className="backoffice-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Source</th>
              <th>Status</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                role="link"
                tabIndex={0}
                onClick={() => openInvoice(invoice.id)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openInvoice(invoice.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <strong>{invoice.invoiceNumber}</strong>
                  <div>{formatDate(invoice.createdAt)}</div>
                </td>

                <td>
                  <strong>
                    {invoice.customerFirstName}{" "}
                    {invoice.customerLastName}
                  </strong>

                  {invoice.customerCompany ? (
                    <div>{invoice.customerCompany}</div>
                  ) : null}
                </td>

                <td>{sourceLabels[invoice.source]}</td>
                <td>{statusLabels[invoice.status]}</td>
                <td>{formatMoney(invoice.total)}</td>
                <td>{formatMoney(invoice.amountPaid)}</td>
                <td>{formatMoney(invoice.balanceDue)}</td>
              </tr>
            ))}

            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  {invoices.length === 0
                    ? "No invoices have been created yet."
                    : "No invoices match your search or filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
