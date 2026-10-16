import BackOfficeInvoiceDirectory from "@/components/backoffice/BackOfficeInvoiceDirectory";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

function getMonthRange(month?: string) {
  const now = new Date();

  const match = month?.match(/^(\d{4})-(\d{2})$/);
  const year = match ? Number(match[1]) : now.getFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : now.getMonth();

  const valid =
    Number.isInteger(year) &&
    monthIndex >= 0 &&
    monthIndex <= 11;

  const safeYear = valid ? year : now.getFullYear();
  const safeMonth = valid ? monthIndex : now.getMonth();

  return {
    value: `${safeYear}-${String(safeMonth + 1).padStart(2, "0")}`,
    start: new Date(safeYear, safeMonth, 1),
    end: new Date(safeYear, safeMonth + 1, 1),
  };
}

export default async function BackOfficeInvoicesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const selectedMonth = getMonthRange(params.month);

  const [invoices, availableMonths] = await Promise.all([
    prisma.backOfficeInvoice.findMany({
      where: {
        createdAt: {
          gte: selectedMonth.start,
          lt: selectedMonth.end,
        },
      },
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
    }),
    prisma.backOfficeInvoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

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

  const monthOptions = Array.from(
    new Set(
      availableMonths.map((invoice) => {
        const date = invoice.createdAt;
        return `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
      })
    )
  );

  if (!monthOptions.includes(selectedMonth.value)) {
    monthOptions.unshift(selectedMonth.value);
  }

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const monthLabel = selectedMonth.start.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

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
          <span>{monthLabel} Invoices</span>
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

      <BackOfficeInvoiceDirectory
        invoices={invoiceRows}
        selectedMonth={selectedMonth.value}
        monthOptions={monthOptions}
      />
    </>
  );
}
