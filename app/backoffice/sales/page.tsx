import BackOfficeInvoiceDirectory from "@/components/backoffice/BackOfficeInvoiceDirectory";
import { prisma } from "@/lib/prisma";

export default async function BackOfficeInvoicesPage() {
  const invoices = await prisma.backOfficeInvoice.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      invoiceNumber: true,
      source: true,
      status: true,
      customerFirstName: true,
      customerLastName: true,
      customerCompany: true,
      locationCode: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
      createdAt: true,
    },
  });

  const activeInvoices = invoices.filter(
    (invoice) => invoice.status !== "VOID"
  );

  const completedSales = invoices
    .filter((invoice) => invoice.status === "COMPLETED")
    .reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

  const outstandingBalance = activeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balanceDue),
    0
  );

  const totalCollected = activeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amountPaid),
    0
  );

  const invoiceRows = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    source: invoice.source,
    status: invoice.status,
    customerFirstName: invoice.customerFirstName,
    customerLastName: invoice.customerLastName,
    customerCompany: invoice.customerCompany,
    locationCode: invoice.locationCode,
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    balanceDue: Number(invoice.balanceDue),
    createdAt: invoice.createdAt.toISOString(),
  }));

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVOICES
          </span>

          <h1>Invoices</h1>

          <p>
            Review sales, payments, balances, and invoice history.
          </p>
        </div>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Total Invoices</span>
          <strong>{invoices.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Completed Sales</span>
          <strong>{formatMoney(completedSales)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Outstanding Balance</span>
          <strong>{formatMoney(outstandingBalance)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Total Collected</span>
          <strong>{formatMoney(totalCollected)}</strong>
        </div>
      </div>

      <BackOfficeInvoiceDirectory invoices={invoiceRows} />
    </>
  );
}
