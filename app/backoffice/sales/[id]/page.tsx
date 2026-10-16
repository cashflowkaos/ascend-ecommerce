import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackOfficeInvoicePaymentForm from "@/components/backoffice/BackOfficeInvoicePaymentForm";

export const dynamic = "force-dynamic";

const sourceLabels = {
  POS: "POS",
  WEBSITE: "Website",
  LEGACY_IMPORT: "Legacy Import",
} as const;

const statusLabels = {
  OPEN: "Open",
  COMPLETED: "Completed",
  VOID: "Void",
} as const;

const paymentMethodLabels = {
  CASH: "Cash",
  ZELLE: "Zelle",
} as const;

const paymentTypeLabels = {
  PAYMENT: "Payment",
  REFUND: "Refund",
} as const;

function formatMoney(value: unknown) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BackOfficeInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await prisma.backOfficeInvoice.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          allocations: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              batch: {
                select: {
                  batchNumber: true,
                },
              },
              location: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      payments: {
        orderBy: {
          receivedAt: "asc",
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const customerName =
    `${invoice.customerFirstName} ${invoice.customerLastName}`.trim();

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVOICES / INVOICE
          </span>

          <h1>{invoice.invoiceNumber}</h1>

          <p>
            {statusLabels[invoice.status]} invoice from{" "}
            {sourceLabels[invoice.source]}.
          </p>
        </div>

        <Link
          href="/backoffice/sales"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Invoices
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Total</span>
          <strong>{formatMoney(invoice.total)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Paid</span>
          <strong>{formatMoney(invoice.amountPaid)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Balance Due</span>
          <strong>{formatMoney(invoice.balanceDue)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Status</span>
          <strong>{statusLabels[invoice.status]}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              INVOICE DETAILS
            </span>
            <h2>Sale Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <div className="backoffice-form-field">
            <span>Customer</span>
            <strong>{customerName}</strong>
            {invoice.customerCompany ? (
              <small>{invoice.customerCompany}</small>
            ) : null}
          </div>

          <div className="backoffice-form-field">
            <span>Location</span>
            <strong>{invoice.locationName}</strong>
            <small>{invoice.locationCode}</small>
          </div>

          <div className="backoffice-form-field">
            <span>Source</span>
            <strong>{sourceLabels[invoice.source]}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Created</span>
            <strong>{formatDate(invoice.createdAt)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Pricing</span>
            <strong>
              {invoice.pricingType.replaceAll("_", " ")}
            </strong>
          </div>

          <div className="backoffice-form-field">
            <span>Created By</span>
            <strong>{invoice.createdByName || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              LINE ITEMS
            </span>
            <h2>Invoice Items</h2>
          </div>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Sell Unit</th>
                <th>Qty</th>
                <th>Base Units</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.productName}</strong>
                    <div>{item.sku || "-"}</div>

                    {item.priceAdjusted ? (
                      <small>
                        Price adjusted
                        {item.priceAdjustmentReason
                          ? ` - ${item.priceAdjustmentReason}`
                          : ""}
                      </small>
                    ) : null}
                  </td>

                  <td>
                    {item.sellUnit === "KIT"
                      ? `Kit (${item.unitsPerSellUnit})`
                      : "Unit"}
                  </td>

                  <td>{item.quantity}</td>
                  <td>{item.baseUnitsTotal}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td>{formatMoney(item.lineTotal)}</td>
                </tr>
              ))}

              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No line items recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              TOTALS
            </span>
            <h2>Accounting Summary</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <div className="backoffice-form-field">
            <span>Subtotal</span>
            <strong>{formatMoney(invoice.subtotal)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Discount</span>
            <strong>
              {formatMoney(invoice.discountAmount)}
            </strong>
          </div>

          <div className="backoffice-form-field">
            <span>Tax</span>
            <strong>{formatMoney(invoice.taxAmount)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Total</span>
            <strong>{formatMoney(invoice.total)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Amount Paid</span>
            <strong>{formatMoney(invoice.amountPaid)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Balance Due</span>
            <strong>{formatMoney(invoice.balanceDue)}</strong>
          </div>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PAYMENTS
            </span>
            <h2>Payment History</h2>
          </div>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Received By</th>
              </tr>
            </thead>

            <tbody>
              {invoice.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.receivedAt)}</td>
                  <td>
                    {paymentTypeLabels[payment.type]}
                  </td>
                  <td>
                    {paymentMethodLabels[payment.method]}
                  </td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{payment.zelleReference || "-"}</td>
                  <td>{payment.receivedByName || "-"}</td>
                </tr>
              ))}

              {invoice.payments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No payments recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {invoice.status !== "VOID" &&
      Number(invoice.balanceDue) > 0 ? (
        <BackOfficeInvoicePaymentForm
          invoiceId={invoice.id}
          balanceDue={Number(invoice.balanceDue)}
        />
      ) : null}

      {invoice.items.some(
        (item) => item.allocations.length > 0
      ) ? (
        <div className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                INVENTORY
              </span>
              <h2>Batch Allocations</h2>
            </div>
          </div>

          <div className="backoffice-table-wrap">
            <table className="backoffice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Batch</th>
                  <th>Location</th>
                  <th>Base Units</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.flatMap((item) =>
                  item.allocations.map((allocation) => (
                    <tr key={allocation.id}>
                      <td>{item.productName}</td>
                      <td>{allocation.batch.batchNumber}</td>
                      <td>
                        {allocation.location.name} (
                        {allocation.location.code})
                      </td>
                      <td>{allocation.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {invoice.status === "VOID" ? (
        <div className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                VOID HISTORY
              </span>
              <h2>Voided Invoice</h2>
            </div>
          </div>

          <div className="backoffice-form-grid">
            <div className="backoffice-form-field">
              <span>Voided</span>
              <strong>
                {invoice.voidedAt
                  ? formatDate(invoice.voidedAt)
                  : "-"}
              </strong>
            </div>

            <div className="backoffice-form-field">
              <span>Voided By</span>
              <strong>{invoice.voidedByName || "-"}</strong>
            </div>

            <div className="backoffice-form-field backoffice-form-field-wide">
              <span>Reason</span>
              <strong>{invoice.voidReason || "-"}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
