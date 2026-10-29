import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function BackOfficePage() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const fourWeeksStart = addDays(weekStart, -21);

  const [
    invoices,
    monthExpenses,
    monthPurchasePayments,
    latestReconciliation,
    products,
    pendingWebsiteOrders,
    openInvoices,
  ] = await Promise.all([
    prisma.backOfficeInvoice.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          { completedAt: { gte: fourWeeksStart } },
          {
            completedAt: null,
            createdAt: { gte: fourWeeksStart },
          },
        ],
      },
      orderBy: [
        { completedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        completedAt: true,
        createdAt: true,
        customerFirstName: true,
        customerLastName: true,
        customerCompany: true,
        items: {
          select: {
            productName: true,
            baseUnitsTotal: true,
            lineTotal: true,
          },
        },
      },
    }),

    prisma.backOfficeExpense.aggregate({
      where: {
        expenseDate: { gte: monthStart },
      },
      _sum: { amount: true },
    }),

    prisma.backOfficePurchasePayment.aggregate({
      where: { paidAt: { gte: monthStart }, voidedAt: null },
      _sum: { amount: true },
    }),

    prisma.backOfficeReconciliation.findFirst({
      orderBy: [
        { weekEnding: "desc" },
        { createdAt: "desc" },
      ],
    }),

    prisma.backOfficeProduct.findMany({
      where: {
        active: true,
        inventoryType: {
          not: "NON_INVENTORY",
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        inventoryType: true,
        cost: true,
        unitsPerKit: true,
        batches: {
          select: {
            balances: {
              select: {
                quantity: true,
              },
            },
            purchaseReceiptItems: {
              select: {
                quantityReceived: true,
                physicalUnitCost: true,
                receipt: {
                  select: {
                    voidedAt: true,
                  },
                },
              },
            },
          },
        },
        simpleBalances: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    Promise.resolve(0),


    prisma.backOfficeInvoice.count({
      where: {
        status: {
          notIn: ["COMPLETED", "VOID"],
        },
        balanceDue: {
          gt: 0,
        },
      },
    }),
  ]);

  const getInvoiceDate = (
    invoice: (typeof invoices)[number]
  ) => invoice.completedAt ?? invoice.createdAt;

  function summarize(list: typeof invoices) {
    const sales = list.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const units = list.reduce(
      (sum, invoice) =>
        sum +
        invoice.items.reduce(
          (itemSum, item) =>
            itemSum + item.baseUnitsTotal,
          0
        ),
      0
    );

    return {
      sales,
      orders: list.length,
      units,
      averageOrder:
        list.length > 0 ? sales / list.length : 0,
    };
  }

  const weeks = Array.from({ length: 4 }, (_, index) => {
    const start = addDays(weekStart, -7 * index);
    const end = addDays(start, 7);

    const list = invoices.filter((invoice) => {
      const date = getInvoiceDate(invoice);
      return date >= start && date < end;
    });

    return {
      ...summarize(list),
      start,
      end,
      label:
        index === 0
          ? "This Week"
          : index === 1
            ? "Last Week"
            : `${index} Weeks Ago`,
    };
  });

  const monthInvoices = invoices.filter(
    (invoice) => getInvoiceDate(invoice) >= monthStart
  );

  const month = summarize(monthInvoices);
  const expenses = Number(
    monthExpenses._sum.amount ?? 0
  );
  const purchasePayments = Number(monthPurchasePayments._sum.amount ?? 0);
  const cashOutflow = expenses + purchasePayments;
  const monthNet = month.sales - cashOutflow;

  const inventory = products.map((product) => {
    let quantity = 0;
    let value = 0;

    const catalogUnitCost =
      Number(product.cost ?? 0) /
      (product.inventoryType === "BATCHED"
        ? Math.max(1, product.unitsPerKit)
        : 1);

    if (product.inventoryType === "SIMPLE") {
      quantity = product.simpleBalances.reduce(
        (sum, balance) => sum + balance.quantity,
        0
      );

      value = quantity * catalogUnitCost;
    } else {
      for (const batch of product.batches) {
        const stock = batch.balances.reduce(
          (sum, balance) => sum + balance.quantity,
          0
        );

        quantity += stock;

        if (stock <= 0) continue;

        const receipts = batch.purchaseReceiptItems.filter(
          (receipt) =>
            !receipt.receipt.voidedAt &&
            receipt.physicalUnitCost !== null &&
            receipt.quantityReceived > 0
        );

        const receivedQuantity = receipts.reduce(
          (sum, receipt) => sum + receipt.quantityReceived,
          0
        );

        const unitCost =
          receivedQuantity > 0
            ? receipts.reduce(
                (sum, receipt) =>
                  sum +
                  receipt.quantityReceived *
                    Number(receipt.physicalUnitCost),
                0
              ) / receivedQuantity
            : catalogUnitCost;

        value += stock * unitCost;
      }
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      value,
    };
  });
  const totalPhysicalUnits = inventory.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const totalInventoryValue = inventory.reduce(
    (sum, product) => sum + product.value,
    0
  );

  const outOfStock = inventory.filter(
    (product) => product.quantity <= 0
  );

  const lowStock = inventory.filter(
    (product) =>
      product.quantity > 0 &&
      product.quantity <= 10
  );

  const inventoryAttention = [
    ...outOfStock,
    ...lowStock,
  ].slice(0, 5);

  const productMap = new Map<
    string,
    {
      name: string;
      revenue: number;
      units: number;
    }
  >();

  for (const invoice of monthInvoices) {
    for (const item of invoice.items) {
      const key = item.productName
        .trim()
        .toLowerCase();

      const current = productMap.get(key) ?? {
        name: item.productName,
        revenue: 0,
        units: 0,
      };

      current.revenue += Number(item.lineTotal);
      current.units += item.baseUnitsTotal;

      productMap.set(key, current);
    }
  }

  const topProducts = Array.from(
    productMap.values()
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentSales = invoices.slice(0, 5);

  const expectedFunds = latestReconciliation
    ? Number(
        latestReconciliation.expectedFunds ??
          Number(
            latestReconciliation.openingFunds ?? 2339
          ) +
            Number(latestReconciliation.recordedNet)
      )
    : null;

  const actualFunds = latestReconciliation
    ? Number(latestReconciliation.actualFunds)
    : null;

  const variance = latestReconciliation
    ? Number(latestReconciliation.variance)
    : null;

  return (
    <div className="space-y-8">
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            OVERVIEW
          </span>
          <h1>Business Overview</h1>
          <p>
            Current performance and operating position for
            Ascend Peptide Co.
          </p>
        </div>

        <Link
          href="/backoffice/pos"
          className="backoffice-primary-button"
        >
          Open POS
        </Link>
      </div>

      <section className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              SALES PULSE
            </span>
            <h2>Last 4 Weeks</h2>
          </div>

          <Link
            href="/backoffice/analytics"
            className="backoffice-text-link"
          >
            View Analytics
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {weeks.map((week, index) => {
            const previous =
              index < weeks.length - 1
                ? weeks[index + 1]
                : null;

            const change =
              previous && previous.sales > 0
                ? ((week.sales - previous.sales) /
                    previous.sales) *
                  100
                : null;

            return (
              <div
                key={week.label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="border-b border-slate-100 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    {week.label}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {shortDate(week.start)} -{" "}
                    {shortDate(addDays(week.end, -1))}
                  </div>
                </div>

                <div className="mt-4 text-2xl font-bold text-slate-950">
                  {money(week.sales)}
                </div>

                {change !== null ? (
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}% vs prior week
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-slate-400">
                    Sales
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Orders
                    </div>
                    <div className="mt-1 font-semibold">
                      {week.orders}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Units
                    </div>
                    <div className="mt-1 font-semibold">
                      {week.units}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Avg
                    </div>
                    <div className="mt-1 font-semibold">
                      {money(week.averageOrder)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <span className="backoffice-eyebrow">
            THIS MONTH
          </span>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {now.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        <div className="backoffice-stat-grid">
          <div className="backoffice-stat-card">
            <span>Sales</span>
            <strong>{money(month.sales)}</strong>
            <small>
              {month.units.toLocaleString()} physical units
            </small>
          </div>

          <div className="backoffice-stat-card">
            <span>Operating Expenses</span>
            <strong>{money(expenses)}</strong>
            <small>{money(purchasePayments)} inventory purchases</small>
          </div>

          <div className="backoffice-stat-card">
            <span>Net Cash Activity</span>
            <strong>{money(monthNet)}</strong>
            <small>{money(cashOutflow)} total cash outflow</small>
          </div>

          <div className="backoffice-stat-card">
            <span>Orders</span>
            <strong>{month.orders}</strong>
            <small>
              {money(month.averageOrder)} average
            </small>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                CAPITAL POSITION
              </span>
              <h2>Latest Reconciliation</h2>
            </div>

            <Link
              href="/backoffice/analytics"
              className="backoffice-text-link"
            >
              Reconcile
            </Link>
          </div>

          {latestReconciliation &&
          expectedFunds !== null &&
          actualFunds !== null &&
          variance !== null ? (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Actual Funds
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {money(actualFunds)}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Expected
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {money(expectedFunds)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    Cash
                  </div>
                  <div className="font-semibold">
                    {money(
                      Number(
                        latestReconciliation.actualCash
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">
                    Bank / Zelle
                  </div>
                  <div className="font-semibold">
                    {money(
                      Number(
                        latestReconciliation.actualBank
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs text-slate-500">
                    Difference
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {variance > 0 ? "+" : ""}
                    {money(variance)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold">
                    {variance > 0
                      ? "OVER"
                      : variance < 0
                        ? "UNDER"
                        : "BALANCED"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Last reconciled{" "}
                    {latestReconciliation.createdAt.toLocaleDateString(
                      "en-US"
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              No capital reconciliation recorded yet.
            </div>
          )}
        </section>

        <section className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                INVENTORY HEALTH
              </span>
              <h2>Physical Inventory</h2>
            </div>

            <Link
              href="/backoffice/inventory"
              className="backoffice-text-link"
            >
              View Inventory
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Physical Units
              </div>
              <div className="mt-1 text-xl font-bold">
                {totalPhysicalUnits.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Active Products
              </div>
              <div className="mt-1 text-xl font-bold">
                {products.length}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Total Inventory Value
              </div>
              <div className="mt-1 text-xl font-bold">
                {money(totalInventoryValue)}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Low Stock
              </div>
              <div className="mt-1 text-xl font-bold">
                {lowStock.length}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Out of Stock
              </div>
              <div className="mt-1 text-xl font-bold">
                {outOfStock.length}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                PRODUCTS
              </span>
              <h2>Top Products This Month</h2>
            </div>

            <Link
              href="/backoffice/analytics"
              className="backoffice-text-link"
            >
              Details
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <div className="py-5 text-sm text-slate-500">
                No completed product sales this month.
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {index + 1}. {product.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {product.units.toLocaleString()} physical units
                    </div>
                  </div>

                  <div className="shrink-0 font-semibold">
                    {money(product.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                NEEDS ATTENTION
              </span>
              <h2>Operations</h2>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <Link
              href="/backoffice/pos"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <span>Queued Website Orders</span>
              <strong>{pendingWebsiteOrders}</strong>
            </Link>

            <Link
              href="/backoffice/sales"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <span>Open Invoice Balances</span>
              <strong>{openInvoices}</strong>
            </Link>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">
                  Inventory Attention
                </span>
                <strong>
                  {outOfStock.length + lowStock.length}
                </strong>
              </div>

              {inventoryAttention.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Inventory levels look healthy.
                </div>
              ) : (
                <div className="grid gap-2">
                  {inventoryAttention.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="truncate">
                        {product.name}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {product.quantity <= 0
                          ? "OUT"
                          : `${product.quantity} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              RECENT SALES
            </span>
            <h2>Latest Completed Sales</h2>
          </div>

          <Link
            href="/backoffice/sales"
            className="backoffice-secondary-button"
          >
            View Sales
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {recentSales.length === 0 ? (
            <div className="py-5 text-sm text-slate-500">
              No completed sales found.
            </div>
          ) : (
            recentSales.map((invoice) => {
              const customer =
                invoice.customerCompany ||
                [
                  invoice.customerFirstName,
                  invoice.customerLastName,
                ]
                  .filter(Boolean)
                  .join(" ") ||
                "Walk-in Customer";

              return (
                <Link
                  key={invoice.id}
                  href={`/backoffice/sales/${invoice.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {customer} &middot;{" "}
                      {getInvoiceDate(
                        invoice
                      ).toLocaleDateString("en-US")}
                    </div>
                  </div>

                  <div className="shrink-0 font-bold">
                    {money(Number(invoice.total))}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
