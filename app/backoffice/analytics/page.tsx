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

  const [invoices, expenses] = await Promise.all([
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

  const salesLessRecordedExpenses = totalSales - totalExpenses;

  const maxMonthlyActivity = Math.max(
    1,
    ...monthly.flatMap((entry) => [
      entry.sales,
      Math.abs(entry.expenses),
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
    <div className="space-y-8">
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

        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-3">
          <div>
            <div className="text-sm text-slate-500">Sales</div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(totalSales)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">Expenses</div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(totalExpenses)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">
              Sales Less Recorded Expenses
            </div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {money(salesLessRecordedExpenses)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Units</th>
                <th className="px-5 py-3">Sales vs Expenses</th>
                <th className="px-5 py-3 text-right">Sales</th>
                <th className="px-5 py-3 text-right">Expenses</th>
                <th className="px-5 py-3 text-right">Net Activity</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {monthly.map((entry) => {
                const salesWidth =
                  (entry.sales / maxMonthlyActivity) * 100;
                const expenseWidth =
                  (Math.abs(entry.expenses) /
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
                                Math.abs(entry.expenses) > 0 ? 2 : 0
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
                      {money(entry.sales - entry.expenses)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

        <div className="overflow-x-auto">
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
                        : "â€”"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        Sales Less Recorded Expenses is sales minus recorded expenses and is
        intended as an operational metric. It is not an accounting
        profit, cash balance, or financial statement.
      </div>
    </div>
  );
}