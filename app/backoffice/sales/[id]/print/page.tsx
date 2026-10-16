import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackOfficePrintButton from "@/components/backoffice/BackOfficePrintButton";

export const dynamic = "force-dynamic";

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
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BackOfficeInvoicePrintPage({
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
    <div className="invoice-print-page">
      <div className="invoice-print-toolbar">
        <Link
          href={`/backoffice/sales/${invoice.id}`}
          className="backoffice-secondary-button"
        >
          Back to Invoice
        </Link>

        <BackOfficePrintButton />
      </div>

      <article className="invoice-print-document">
        <header className="invoice-print-header">
          <div>
            <h1>ASCEND PEPTIDE CO.</h1>
            <p>ascendpepco.com</p>
            <p>Anaheim, CA</p>
            <p>support@ascendpepco.com</p>
          </div>

          <div className="invoice-print-title">
            <span>INVOICE</span>
            <strong>{invoice.invoiceNumber}</strong>
            <p>{formatDate(invoice.createdAt)}</p>
          </div>
        </header>

        {invoice.status === "VOID" ? (
          <div className="invoice-print-void-banner">
            VOID
          </div>
        ) : null}

        <section className="invoice-print-info-grid">
          <div>
            <span className="invoice-print-label">
              BILL TO
            </span>
            <strong>{customerName}</strong>

            {invoice.customerCompany ? (
              <p>{invoice.customerCompany}</p>
            ) : null}

            {invoice.customerEmail ? (
              <p>{invoice.customerEmail}</p>
            ) : null}

            {invoice.customerPhone ? (
              <p>{invoice.customerPhone}</p>
            ) : null}
          </div>

          <div>
            <span className="invoice-print-label">
              INVOICE DETAILS
            </span>

            <p>
              <strong>Status:</strong>{" "}
              {statusLabels[invoice.status]}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {invoice.locationName}
            </p>
          </div>
        </section>

        <table className="invoice-print-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.productName}</strong>
                  {item.sku ? <small>{item.sku}</small> : null}
                </td>

                <td>
                  {item.sellUnit === "KIT"
                    ? `Kit (${item.unitsPerSellUnit})`
                    : "Unit"}
                </td>

                <td>{item.quantity}</td>
                <td>{formatMoney(item.unitPrice)}</td>
                <td>{formatMoney(item.lineTotal)}</td>
              </tr>
            ))}

            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={5}>No line items recorded.</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <section className="invoice-print-summary">
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(invoice.subtotal)}</strong>
          </div>

          {Number(invoice.discountAmount) > 0 ? (
            <div>
              <span>Discount</span>
              <strong>
                -{formatMoney(invoice.discountAmount)}
              </strong>
            </div>
          ) : null}

          {Number(invoice.taxAmount) > 0 ? (
            <div>
              <span>Tax</span>
              <strong>{formatMoney(invoice.taxAmount)}</strong>
            </div>
          ) : null}

          <div className="invoice-print-total">
            <span>Total</span>
            <strong>{formatMoney(invoice.total)}</strong>
          </div>

          <div>
            <span>Amount Paid</span>
            <strong>{formatMoney(invoice.amountPaid)}</strong>
          </div>

          <div className="invoice-print-balance">
            <span>Balance Due</span>
            <strong>{formatMoney(invoice.balanceDue)}</strong>
          </div>
        </section>

        {invoice.payments.length > 0 ? (
          <section className="invoice-print-payments">
            <h2>Payment History</h2>

            <table className="invoice-print-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {formatDateTime(payment.receivedAt)}
                    </td>
                    <td>
                      {paymentTypeLabels[payment.type]}
                    </td>
                    <td>
                      {paymentMethodLabels[payment.method]}
                    </td>
                    <td>
                      {payment.zelleReference || "-"}
                    </td>
                    <td>{formatMoney(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {invoice.status === "VOID" ? (
          <section className="invoice-print-void-details">
            <strong>VOIDED INVOICE</strong>
            <p>{invoice.voidReason || "No reason recorded."}</p>
          </section>
        ) : null}

        <footer className="invoice-print-footer">
          <strong>Thank you.</strong>
          <span>Ascend Peptide Co. | ascendpepco.com</span>
        </footer>
      </article>
    </div>
  );
}