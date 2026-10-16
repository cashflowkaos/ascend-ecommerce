"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );
}

export default function BackOfficeInvoiceDirectory({
  invoices,
  selectedMonth,
  monthOptions,
}: {
  invoices: InvoiceRow[];
  selectedMonth: string;
  monthOptions: string[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [searchResults, setSearchResults] = useState<
    InvoiceRow[]
  >([]);
  const [searching, setSearching] = useState(false);

  const query = search.trim();
  const globalSearchActive = query.length >= 2;

  useEffect(() => {
    if (!globalSearchActive) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(
          `/api/backoffice/invoices/search?q=${encodeURIComponent(
            query
          )}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Search failed.");
        }

        const data = (await response.json()) as {
          invoices: InvoiceRow[];
        };

        setSearchResults(data.invoices);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [globalSearchActive, query]);

  const visibleInvoices = globalSearchActive
    ? searchResults
    : invoices;

  const filteredInvoices = useMemo(() => {
    return visibleInvoices.filter((invoice) => {
      if (status !== "ALL" && invoice.status !== status) {
        return false;
      }

      if (source !== "ALL" && invoice.source !== source) {
        return false;
      }

      return true;
    });
  }, [visibleInvoices, status, source]);

  function openInvoice(id: string) {
    router.push(`/backoffice/sales/${id}`);
  }

  function changeMonth(value: string) {
    setSearch("");
    setSearchResults([]);
    setStatus("ALL");
    setSource("ALL");
    router.push(`/backoffice/sales?month=${value}`);
  }

  return (
    <div className="backoffice-panel">
      <div className="backoffice-panel-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVOICE DIRECTORY
          </span>

          <h2>
            {globalSearchActive
              ? "Search Results"
              : formatMonth(selectedMonth)}
          </h2>
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
        <select
          value={selectedMonth}
          onChange={(event) =>
            changeMonth(event.target.value)
          }
          style={{
            minHeight: "42px",
            padding: "0 10px",
          }}
          aria-label="Invoice month"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search all invoice history..."
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
          onChange={(event) =>
            setStatus(event.target.value)
          }
          style={{
            minHeight: "42px",
            padding: "0 10px",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOID">Void</option>
        </select>

        <select
          value={source}
          onChange={(event) =>
            setSource(event.target.value)
          }
          style={{
            minHeight: "42px",
            padding: "0 10px",
          }}
        >
          <option value="ALL">All Sources</option>
          <option value="POS">POS</option>
          <option value="WEBSITE">Website</option>
          <option value="LEGACY_IMPORT">
            Legacy
          </option>
        </select>

        <span style={{ whiteSpace: "nowrap" }}>
          {searching
            ? "Searching..."
            : `${filteredInvoices.length} ${
                filteredInvoices.length === 1
                  ? "invoice"
                  : "invoices"
              }`}
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
                onClick={() =>
                  openInvoice(invoice.id)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openInvoice(invoice.id);
                  }
                }}
                style={{
                  cursor: "pointer",
                }}
              >
                <td>
                  <strong>
                    {invoice.invoiceNumber}
                  </strong>
                  <div>
                    {formatDate(invoice.createdAt)}
                  </div>
                </td>

                <td>
                  <strong>
                    {invoice.customerFirstName}{" "}
                    {invoice.customerLastName}
                  </strong>

                  {invoice.customerCompany ? (
                    <div>
                      {invoice.customerCompany}
                    </div>
                  ) : null}
                </td>

                <td>
                  {sourceLabels[invoice.source]}
                </td>

                <td>
                  {statusLabels[invoice.status]}
                </td>

                <td>
                  {formatMoney(invoice.total)}
                </td>

                <td>
                  {formatMoney(invoice.amountPaid)}
                </td>

                <td>
                  {formatMoney(invoice.balanceDue)}
                </td>
              </tr>
            ))}

            {!searching &&
            filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  {globalSearchActive
                    ? "No invoices found in invoice history."
                    : invoices.length === 0
                      ? `No invoices for ${formatMonth(
                          selectedMonth
                        )}.`
                      : "No invoices match your filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {globalSearchActive &&
      !searching &&
      searchResults.length === 25 ? (
        <div
          style={{
            paddingTop: "12px",
            fontSize: "0.9rem",
            opacity: 0.7,
          }}
        >
          Showing the 25 most recent matches. Refine your
          search for narrower results.
        </div>
      ) : null}
    </div>
  );
}
