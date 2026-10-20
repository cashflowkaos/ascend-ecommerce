import Link from "next/link";
import { Plus } from "lucide-react";
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
  const expenses = await prisma.backOfficeExpense.findMany({
    orderBy: [
      { expenseDate: "desc" },
      { createdAt: "desc" },
    ],
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousMonthYear =
    currentMonth === 0 ? currentYear - 1 : currentYear;

  let thisMonth = 0;
  let lastMonth = 0;
  let allTime = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    allTime += amount;

    const month = expense.expenseDate.getMonth();
    const year = expense.expenseDate.getFullYear();

    if (month === currentMonth && year === currentYear) {
      thisMonth += amount;
    }

    if (
      month === previousMonth &&
      year === previousMonthYear
    ) {
      lastMonth += amount;
    }
  }

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">EXPENSES</span>
          <h1>Expenses</h1>
          <p>
            Track inventory purchases, shipping, operating costs,
            contractors, fees, and other business expenses.
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
          <span>All Time</span>
          <strong>{formatMoney(allTime)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Expense Records</span>
          <strong>{expenses.length}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              EXPENSE HISTORY
            </span>
            <h2>All Expenses</h2>
          </div>
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
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <Link href={`/backoffice/expenses/${expense.id}`}>
                      <strong>{formatDate(expense.expenseDate)}</strong>
                    </Link>
                  </td>
                  <td>{expense.category}</td>
                  <td>{expense.vendor || "—"}</td>
                  <td>{expense.description || "—"}</td>
                  <td>{expense.paidFrom || "—"}</td>
                  <td>
                    <strong>{formatMoney(Number(expense.amount))}</strong>
                  </td>
                </tr>
              ))}

              {expenses.length === 0 ? (
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