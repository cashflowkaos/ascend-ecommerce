import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default async function BackOfficeExpensesPage() {
  const [expenses, purchasePayments] = await Promise.all([
    prisma.backOfficeExpense.findMany({
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.backOfficePurchasePayment.findMany({
      where: {
        voidedAt: null,
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousMonthYear =
    currentMonth === 0 ? currentYear - 1 : currentYear;

  let thisMonth = 0;
  let lastMonth = 0;
  let allTime = 0;

  const categoryMap = new Map<
    string,
    { total: number; count: number }
  >();

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    allTime += amount;

    const month = expense.expenseDate.getMonth();
    const year = expense.expenseDate.getFullYear();

    if (month === currentMonth && year === currentYear) {
      thisMonth += amount;
    }

    if (month === previousMonth && year === previousMonthYear) {
      lastMonth += amount;
    }

    const existing = categoryMap.get(expense.category) ?? {
      total: 0,
      count: 0,
    };

    existing.total += amount;
    existing.count += 1;

    categoryMap.set(expense.category, existing);
  }

  for (const payment of purchasePayments) {
    const amount = Number(payment.amount);
    allTime += amount;

    const month = payment.paidAt.getMonth();
    const year = payment.paidAt.getFullYear();

    if (month === currentMonth && year === currentYear) {
      thisMonth += amount;
    }

    if (month === previousMonth && year === previousMonthYear) {
      lastMonth += amount;
    }

    const existing = categoryMap.get("Inventory Purchases") ?? {
      total: 0,
      count: 0,
    };

    existing.total += amount;
    existing.count += 1;

    categoryMap.set("Inventory Purchases", existing);
  }

  const categories = [...categoryMap.entries()]
    .map(([name, values]) => ({
      name,
      ...values,
    }))
    .sort((a, b) => b.total - a.total);

  const recentExpenses = [
    ...expenses.map((expense) => ({
      id: expense.id,
      date: expense.expenseDate,
      category: expense.category,
      vendor: expense.vendor,
      description: expense.description,
      paidFrom: expense.paidFrom,
      amount: Number(expense.amount),
      href: `/backoffice/expenses/${expense.id}`,
    })),
    ...purchasePayments.map((payment) => ({
      id: payment.id,
      date: payment.paidAt,
      category: "Inventory Purchases",
      vendor: payment.purchaseOrder.supplier.name,
      description: `Purchase Order ${payment.purchaseOrder.poNumber}`,
      paidFrom: payment.paidFrom,
      amount: Number(payment.amount),
      href: `/backoffice/purchasing/${payment.purchaseOrderId}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">EXPENSES</span>
          <h1>Expense Dashboard</h1>
          <p>
            See where company money is going, review spending by
            category, and manage individual expenses.
          </p>
        </div>

        <Link
          href="/backoffice/expenses/new"
          className="backoffice-primary-button"
        >
          <Plus size={15} strokeWidth={2} />
          Add Expense
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>This Month</span>
          <strong>{formatMoney(thisMonth)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Last Month</span>
          <strong>{formatMoney(lastMonth)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>All Time Expenses</span>
          <strong>{formatMoney(allTime)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Expense Records</span>
          <strong>{expenses.length + purchasePayments.length}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              SPENDING BREAKDOWN
            </span>
            <h2>Expenses by Category</h2>
            <p>
              Select a category to view every expense recorded under it.
            </p>
          </div>
        </div>

        <div className="backoffice-mobile-data-list">
          {categories.length === 0 ? (
            <div className="backoffice-mobile-empty">
              No expenses recorded yet.
            </div>
          ) : (
            categories.map((category) => (
              <Link
                key={category.name}
                href={`/backoffice/expenses/history?category=${encodeURIComponent(
                  category.name
                )}`}
                className="backoffice-mobile-data-card"
              >
                <div className="backoffice-mobile-card-heading">
                  <strong>{category.name}</strong>
                  <ChevronRight size={17} />
                </div>

                <div className="backoffice-mobile-card-grid">
                  <div>
                    <span>Transactions</span>
                    <strong>{category.count}</strong>
                  </div>
                  <div>
                    <span>Total Spent</span>
                    <strong>{formatMoney(category.total)}</strong>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Transactions</th>
                <th>Total Spent</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td>
                    <Link
                      href={`/backoffice/expenses/history?category=${encodeURIComponent(
                        category.name
                      )}`}
                    >
                      <strong>{category.name}</strong>
                    </Link>
                  </td>

                  <td>{category.count}</td>

                  <td>
                    <strong>{formatMoney(category.total)}</strong>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/backoffice/expenses/history?category=${encodeURIComponent(
                        category.name
                      )}`}
                      aria-label={`View ${category.name} expenses`}
                    >
                      <ChevronRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}

              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4}>No expenses recorded yet.</td>
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
              RECENT ACTIVITY
            </span>
            <h2>Recent Expenses</h2>
            <p>Showing the 10 most recent expense records.</p>
          </div>

          <Link
            href="/backoffice/expenses/history"
            className="backoffice-secondary-button"
          >
            View All Expenses
          </Link>
        </div>

        <div className="backoffice-mobile-data-list">
          {recentExpenses.length === 0 ? (
            <div className="backoffice-mobile-empty">
              No expenses recorded yet.
            </div>
          ) : (
            recentExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={expense.href}
                className="backoffice-mobile-data-card"
              >
                <div className="backoffice-mobile-card-heading">
                  <div>
                    <strong>{formatMoney(Number(expense.amount))}</strong>
                    <span>{formatDate(expense.date)}</span>
                  </div>
                  <ChevronRight size={17} />
                </div>

                <div className="backoffice-mobile-card-grid">
                  <div>
                    <span>Category</span>
                    <strong>{expense.category}</strong>
                  </div>
                  <div>
                    <span>Vendor</span>
                    <strong>{expense.vendor || "-"}</strong>
                  </div>
                  <div>
                    <span>Paid From</span>
                    <strong>{expense.paidFrom || "-"}</strong>
                  </div>
                  <div>
                    <span>Description</span>
                    <strong>{expense.description || "-"}</strong>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Paid From</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {recentExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <Link href={expense.href}>
                      <strong>{formatDate(expense.date)}</strong>
                    </Link>
                  </td>

                  <td>{expense.category}</td>
                  <td>{expense.vendor || "-"}</td>
                  <td>{expense.description || "-"}</td>
                  <td>{expense.paidFrom || "-"}</td>

                  <td>
                    <strong>
                      {formatMoney(Number(expense.amount))}
                    </strong>
                  </td>
                </tr>
              ))}

              {recentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6}>No expenses recorded yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
