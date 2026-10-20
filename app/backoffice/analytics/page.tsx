import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BackOfficeSaveButton from "@/components/backoffice/BackOfficeSaveButton";
import { createBackOfficeReconciliation } from "./actions";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
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

const COMPANY_START = new Date(2026, 3, 1);

function productIdentity(
  productId: string | null,
  sku: string | null,
  productName: string
) {
  const normalizedSku = (sku ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const normalizedName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const strength =
    normalizedName.match(/(\d+(?:\.\d+)?)\s*mg\b/)?.[1] ??
    normalizedSku.match(/(\d+)$/)?.[1] ??
    "";

  let family = normalizedName
    .replace(/\b\d+(?:\.\d+)?\s*mg\b/g, "")
    .replace(/\bstack\b/g, "")
    .trim();

  const aliases: Array<[RegExp, string]> = [
    [/^nad\b/, "nad"],
    [/^retatrutide\b/, "retatrutide"],
    [/^tesamorelin\b/, "tesamorelin"],
    [/^tirzepetide\b|^tirzepatide\b/, "tirzepatide"],
    [/^mots c\b/, "mots-c"],
    [/^bpc157\b|^bpc 157\b/, "bpc-157"],
    [/^cjc ipamorelin\b|^cjc 1295 ipamorelin\b/, "cjc-ipamorelin"],
    [/^klow\b/, "klow"],
    [/^wolverine\b/, "wolverine"],
    [/^ghkcu\b|^ghk cu\b/, "ghk-cu"],
  ];

  for (const [pattern, replacement] of aliases) {
    if (pattern.test(family)) {
      family = replacement;
      break;
    }
  }

  if (family && strength) {
    return `${family}:${strength}`;
  }

  if (sku) {
    return `sku:${normalizedSku}`;
  }

  if (productId) {
    return `product:${productId}`;
  }

  return `name:${normalizedName}`;
}

function excludeFromProductAnalytics(
  sku: string | null,
  productName: string
) {
  const normalizedSku = (sku ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const normalizedName = productName.toLowerCase();

  return (
    normalizedSku === "BAC3" ||
    normalizedSku === "BAC10" ||
    normalizedSku === "BAC3ML" ||
    normalizedSku === "BAC10ML" ||
    normalizedSku.startsWith("SHIPPING") ||
    normalizedSku === "SH" ||
    normalizedName.includes("bacteriostatic") ||
    normalizedName.includes("shipping")
  );
}

type ProductStat = {
  key: string;
  sku: string | null;
  name: string;
  units: number;
  lineQuantity: number;
  orders: Set<string>;
  revenue: number;
};

export default async function BackOfficeAnalyticsPage() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const currentMonthStart = startOfMonth(now);

  const historyStart = COMPANY_START;

  const [invoices, expenses, purchasePayments, reconciliations] = await Promise.all([
    prisma.backOfficeInvoice.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          { completedAt: { gte: historyStart } },
          {
            completedAt: null,
            createdAt: { gte: historyStart },
          },
        ],
      },
      orderBy: [{ completedAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        invoiceNumber: true,
        source: true,
        total: true,
        completedAt: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            sku: true,
            productName: true,
            quantity: true,
            baseUnitsTotal: true,
            lineTotal: true,
          },
        },
      },
    }),

    prisma.backOfficeExpense.findMany({
      where: {
        expenseDate: { gte: historyStart },
      },
      orderBy: { expenseDate: "asc" },
      select: {
        expenseDate: true,
        amount: true,
      },
    }),
    prisma.backOfficePurchasePayment.findMany({
      where: {
        paidAt: { gte: historyStart },
        voidedAt: null,
      },
      orderBy: { paidAt: "asc" },
      select: {
        paidAt: true,
        amount: true,
      },
    }),

    prisma.backOfficeReconciliation.findMany({
      orderBy: [
        { weekEnding: "desc" },
        { createdAt: "desc" },
      ],
      take: 20,
    }),
  ]);

  const getInvoiceDate = (invoice: (typeof invoices)[number]) =>
    invoice.completedAt ?? invoice.createdAt;

  const weekInvoices = invoices.filter(
    (invoice) => getInvoiceDate(invoice) >= weekStart
  );

  const monthInvoices = invoices.filter(
    (invoice) => getInvoiceDate(invoice) >= currentMonthStart
  );

  function summarize(list: typeof invoices) {
    const sales = list.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const units = list.reduce(
      (sum, invoice) =>
        sum +
        invoice.items.reduce(
          (itemSum, item) => itemSum + item.baseUnitsTotal,
          0
        ),
      0
    );

    return {
      sales,
      orders: list.length,
      units,
      averageOrder: list.length > 0 ? sales / list.length : 0,
    };
  }

  const week = summarize(weekInvoices);
  const month = summarize(monthInvoices);

  const weekExpenses = expenses
    .filter((expense) => expense.expenseDate >= weekStart)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const weekEndingDefault = new Date(weekStart);
  weekEndingDefault.setDate(weekEndingDefault.getDate() + 6);

  const weekEndingInput =
    `${weekEndingDefault.getFullYear()}-` +
    `${String(weekEndingDefault.getMonth() + 1).padStart(2, "0")}-` +
    `${String(weekEndingDefault.getDate()).padStart(2, "0")}`;

  const companyStartMonthIndex =
    COMPANY_START.getFullYear() * 12 + COMPANY_START.getMonth();

  const currentMonthIndex =
    now.getFullYear() * 12 + now.getMonth();

  const monthCount =
    currentMonthIndex - companyStartMonthIndex + 1;

  const monthly = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(
      COMPANY_START.getFullYear(),
      COMPANY_START.getMonth() + index,
      1
    );

    return {
      key: monthKey(date),
      label: monthLabel(date),
      sales: 0,
      expenses: 0,
      purchasePayments: 0,
      orders: 0,
      units: 0,
    };
  });

  const monthlyMap = new Map(
    monthly.map((entry) => [entry.key, entry])
  );

  for (const invoice of invoices) {
    const bucket = monthlyMap.get(
      monthKey(getInvoiceDate(invoice))
    );

    if (!bucket) continue;

    bucket.sales += Number(invoice.total);
    bucket.orders += 1;
    bucket.units += invoice.items.reduce(
      (sum, item) => sum + item.baseUnitsTotal,
      0
    );
  }

  for (const expense of expenses) {
    const bucket = monthlyMap.get(monthKey(expense.expenseDate));
    if (!bucket) continue;

    bucket.expenses += Number(expense.amount);
  }

  const productMap = new Map<string, ProductStat>();

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      if (
        excludeFromProductAnalytics(
          item.sku,
          item.productName
        )
      ) {
        continue;
      }

      const key = productIdentity(
        item.productId,
        item.sku,
        item.productName
      );

      const existing = productMap.get(key) ?? {
        key,
        sku: item.sku,
        name: item.productName,
        units: 0,
        lineQuantity: 0,
        orders: new Set<string>(),
        revenue: 0,
      };

      existing.units += item.baseUnitsTotal;
      existing.lineQuantity += item.quantity;
      existing.orders.add(invoice.id);
      existing.revenue += Number(item.lineTotal);

      productMap.set(key, existing);
    }
  }

  const products = [...productMap.values()];

  const byUnits = [...products].sort(
    (a, b) => b.units - a.units || b.revenue - a.revenue
  );

  const byLineQuantity = [...products].sort(
    (a, b) =>
      b.lineQuantity - a.lineQuantity ||
      b.revenue - a.revenue
  );

  const byRevenue = [...products].sort(
    (a, b) => b.revenue - a.revenue || b.units - a.units
  );

  const totalSales = monthly.reduce(
    (sum, entry) => sum + entry.sales,
    0
  );

  const totalExpenses = monthly.reduce(
    (sum, entry) => sum + entry.expenses,
    0
  );

  const totalPurchasePayments = monthly.reduce(
    (sum, entry) => sum + entry.purchasePayments,
    0
  );

  const totalCashOutflow = totalExpenses + totalPurchasePayments;
  const salesLessCashOutflow = totalSales - totalCashOutflow;

  const maxMonthlyActivity = Math.max(
    1,
    ...monthly.flatMap((entry) => [
      entry.sales,
      Math.abs(entry.expenses + entry.purchasePayments),
    ])
  );

  const leaderCard = (
    title: string,
    product: ProductStat | undefined,
    metric: string
  ) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      {product ? (
        <>
          <div className="mt-2 text-lg font-bold text-slate-950">
            {product.name}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {product.sku ?? "No SKU"}
          </div>
          <div className="mt-4 text-2xl font-bold text-slate-950">
            {metric}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {money(product.revenue)} revenue
          </div>
          </>
      ) : (
        <div className="mt-4 text-sm text-slate-500">
          No product sales yet.
        </div>
      )}
    </div>
  );

  return (
    <div className="backoffice-analytics-page space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sales, expenses, operating activity, and product performance.
          </p>
        </div>

        <Link
          href="/backoffice/sales"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Sales
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          This Week
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Sales", money(week.sales)],
            ["Orders", week.orders.toLocaleString()],
            ["Physical Units Sold", week.units.toLocaleString()],
            ["Average Order", money(week.averageOrder)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          This Month
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Sales", money(month.sales)],
            ["Orders", month.orders.toLocaleString()],
            ["Physical Units Sold", month.units.toLocaleString()],
            ["Average Order", money(month.averageOrder)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">
            Company Operating History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completed sales compared with recorded expenses.
          </p>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-sm text-slate-500">Sales</div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(totalSales)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">Operating Expenses</div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(totalExpenses)}
          </div>
            </div>

          <div>
            <div className="text-sm text-slate-500">Inventory Purchases</div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(totalPurchasePayments)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">
              Net Cash Activity
            </div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(salesLessCashOutflow)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {monthly.map((entry) => (
            <div
              key={entry.key}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-semibold text-slate-950">
                    {entry.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {entry.orders} orders &middot; {entry.units} physical units
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Net
                  </div>
                  <div className="mt-1 font-bold text-slate-950">
                    {money(entry.sales - entry.expenses - entry.purchasePayments)}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Sales
                  </div>
                  <div className="mt-1 font-bold text-slate-950">
                    {money(entry.sales)}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Expenses
                  </div>
                  <div className="mt-1 font-bold text-slate-950">
                    {money(entry.expenses)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Units</th>
                <th className="px-5 py-3">Sales vs Cash Outflow</th>
                <th className="px-5 py-3 text-right">Sales</th>
                <th className="px-5 py-3 text-right">Operating Expenses</th>
                <th className="px-5 py-3 text-right">Net Cash Activity</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {monthly.map((entry) => {
                const salesWidth =
                  (entry.sales / maxMonthlyActivity) * 100;
                const expenseWidth =
                  (Math.abs(entry.expenses + entry.purchasePayments) /
                    maxMonthlyActivity) *
                  100;

                return (
                  <tr key={entry.key}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {entry.label}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {entry.orders}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {entry.units}
                    </td>
                    <td className="w-64 px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.max(
                                salesWidth,
                                entry.sales > 0 ? 2 : 0
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-amber-500"
                            style={{
                              width: `${Math.max(
                                expenseWidth,
                                Math.abs(entry.expenses + entry.purchasePayments) > 0 ? 2 : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      {money(entry.sales)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {money(entry.expenses)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {money(entry.sales - entry.expenses - entry.purchasePayments)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">
            Capital Reconciliation
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Compare expected working capital with the money actually held in cash and the bank.
          </p>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expected Working Capital
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">
              {money(2339 + totalSales - totalCashOutflow)}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              $2,339 startup capital + completed sales - recorded expenses
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Recorded Activity
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Completed Sales</span>
                <span className="font-semibold text-slate-950">
                  {money(totalSales)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Recorded Expenses</span>
                <span className="font-semibold text-slate-950">
                  {money(totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
                <span className="text-slate-500">Net Cash Activity</span>
                <span className="font-semibold text-slate-950">
                  {money(totalSales - totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {reconciliations.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Reconciliation
              </div>

              <div className="mt-2 text-3xl font-bold text-slate-950">
                {money(Number(reconciliations[0].actualFunds))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  Difference
                </span>
                <span className="font-bold text-slate-950">
                  {Number(reconciliations[0].variance) > 0 ? "+" : ""}
                  {money(Number(reconciliations[0].variance))}
                  {" "}
                  {Number(reconciliations[0].variance) > 0
                    ? "OVER"
                    : Number(reconciliations[0].variance) < 0
                      ? "UNDER"
                      : "BALANCED"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Reconciliation
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-700">
                Not reconciled yet
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Enter the actual cash and bank balances below.
              </div>
            </div>
          )}
        </div>

        <form
          action={createBackOfficeReconciliation}
          className="border-t border-slate-200 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Cash on Hand
              <input
                type="number"
                name="actualCash"
                min="0"
                step="0.01"
                defaultValue={
                  reconciliations[0]
                    ? Number(reconciliations[0].actualCash).toFixed(2)
                    : "0.00"
                }
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Bank Balance
              <input
                type="number"
                name="actualBank"
                min="0"
                step="0.01"
                defaultValue={
                  reconciliations[0]
                    ? Number(reconciliations[0].actualBank).toFixed(2)
                    : "0.00"
                }
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            Last reconciled actual capital is
            <strong className="ml-1 text-slate-950">{reconciliations[0] ? money(Number(reconciliations[0].actualFunds)) : money(0)}</strong>.
            Expected working capital from the current books is
            <strong className="ml-1 text-slate-950">
              {money(2339 + totalSales - totalCashOutflow)}
            </strong>.
          </div>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
            Reconciliation Note
            <textarea
              name="note"
              rows={3}
              placeholder="Optional note about this capital count"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="mt-4 flex justify-end">
            <BackOfficeSaveButton idleLabel="Reconcile Capital" />
          </div>
        </form>

        <div className="border-t border-slate-200">
          <div className="px-5 py-4">
            <h3 className="font-semibold text-slate-950">
              Reconciliation History
            </h3>
          </div>

          <div className="grid gap-3 px-4 pb-4 md:hidden">
            {reconciliations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No reconciliation snapshots yet.
              </div>
            ) : (
              reconciliations.map((entry) => {
                const difference = Number(entry.variance);
                const expected =
                  entry.expectedFunds === null
                    ? Number(entry.openingFunds ?? 2339) +
                      Number(entry.recordedNet)
                    : Number(entry.expectedFunds);

                const status =
                  difference > 0
                    ? "OVER"
                    : difference < 0
                      ? "UNDER"
                      : "BALANCED";

                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="font-semibold text-slate-950">
                          {entry.createdAt.toLocaleDateString("en-US")}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          {status}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Difference
                        </div>
                        <div className="mt-1 font-bold text-slate-950">
                          {difference > 0 ? "+" : ""}
                          {money(difference)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Expected
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {money(expected)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Actual
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {money(Number(entry.actualFunds))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Cash
                        </div>
                        <div className="mt-1 text-sm text-slate-950">
                          {money(Number(entry.actualCash))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Bank
                        </div>
                        <div className="mt-1 text-sm text-slate-950">
                          {money(Number(entry.actualBank))}
                        </div>
                      </div>
                    </div>

                    {entry.note ? (
                      <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                        {entry.note}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Expected</th>
                  <th className="px-5 py-3 text-right">Cash</th>
                  <th className="px-5 py-3 text-right">Bank</th>
                  <th className="px-5 py-3 text-right">Actual</th>
                  <th className="px-5 py-3 text-right">Difference</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Note</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {reconciliations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No reconciliation snapshots yet.
                    </td>
                  </tr>
                ) : (
                  reconciliations.map((entry) => {
                    const difference = Number(entry.variance);
                    const expected =
                      entry.expectedFunds === null
                        ? Number(entry.openingFunds ?? 2339) +
                          Number(entry.recordedNet)
                        : Number(entry.expectedFunds);

                    return (
                      <tr key={entry.id}>
                        <td className="px-5 py-4 font-medium text-slate-950">
                          {entry.createdAt.toLocaleDateString("en-US")}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {money(expected)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {money(Number(entry.actualCash))}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {money(Number(entry.actualBank))}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {money(Number(entry.actualFunds))}
                        </td>
                        <td className="px-5 py-4 text-right font-bold">
                          {difference > 0 ? "+" : ""}
                          {money(difference)}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {difference > 0
                            ? "OVER"
                            : difference < 0
                              ? "UNDER"
                              : "BALANCED"}
                        </td>
                        <td className="max-w-xs px-5 py-4 text-slate-600">
                          {entry.note || "\u2014"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section>
        <div className="mb-3">
          <h2 className="font-semibold text-slate-950">
            Product Leaders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Based on completed invoice item history since April 2026. BAC water and shipping are excluded.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {leaderCard(
            "Most Physical Units Sold",
            byUnits[0],
            `${byUnits[0]?.units.toLocaleString() ?? 0} units`
          )}

          {leaderCard(
            "Most Selling Units",
            byLineQuantity[0],
            `${byLineQuantity[0]?.lineQuantity.toLocaleString() ?? 0} sold`
          )}

          {leaderCard(
            "Highest Revenue Product",
            byRevenue[0],
            money(byRevenue[0]?.revenue ?? 0)
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">
            Product Performance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            All-time since April 2026, ranked by revenue. BAC water and shipping are excluded.
          </p>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {byRevenue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              No completed product sales found.
            </div>
          ) : (
            byRevenue.map((product, index) => (
              <div
                key={product.key}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-400">
                      #{index + 1}
                    </div>
                    <div className="mt-1 font-semibold text-slate-950">
                      {product.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {product.sku ?? "No SKU"}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Revenue
                    </div>
                    <div className="mt-1 font-bold text-slate-950">
                      {money(product.revenue)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Orders
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {product.orders.size}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Sell Qty
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {product.lineQuantity.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Physical Units
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {product.units.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Revenue / Unit
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {product.units > 0
                        ? money(product.revenue / product.units)
                        : "\u2014"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Sell Qty</th>
                <th className="px-5 py-3 text-right">Physical Units</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">Revenue / Unit</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {byRevenue.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No completed product sales found.
                  </td>
                </tr>
              ) : (
                byRevenue.map((product, index) => (
                  <tr key={product.key}>
                    <td className="px-5 py-4 text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {product.sku ?? "No SKU"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {product.orders.size}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {product.lineQuantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {product.units.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {money(product.revenue)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {product.units > 0
                        ? money(product.revenue / product.units)
                        : "\u2014"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        Net Cash Activity is sales minus recorded expenses and is
        intended as an operational metric. It is not an accounting
        profit, cash balance, or financial statement.
      </div>
    </div>
  );
}
