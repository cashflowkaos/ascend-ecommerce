import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
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

type PageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ExpenseHistoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" && params.category.trim()
      ? params.category.trim()
      : null;

  const expenses = await prisma.backOfficeExpense.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <Link
            href="/backoffice/expenses"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <ArrowLeft size={15} />
            Expense Dashboard
          </Link>

          <span className="backoffice-eyebrow">
            EXPENSE HISTORY
          </span>

          <h1>{category ?? "All Expenses"}</h1>

          <p>
            {category
              ? `Complete expense history for ${category}.`
              : "Complete company expense history."}
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
          <span>
            {category ? "Category Total" : "Total Expenses"}
          </span>
          <strong>{formatMoney(total)}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Records</span>
          <strong>{expenses.length}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              TRANSACTIONS
            </span>
            <h2>
              {category
                ? `${category} Expenses`
                : "All Expense Records"}
            </h2>
          </div>

          {category ? (
            <Link
              href="/backoffice/expenses/history"
              className="backoffice-secondary-button"
            >
              View All Categories
            </Link>
          ) : null}
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
                      <strong>
                        {formatDate(expense.expenseDate)}
                      </strong>
                    </Link>
                  </td>

                  <td>{expense.category}</td>
                  <td>{expense.vendor || "—"}</td>
                  <td>{expense.description || "—"}</td>
                  <td>{expense.paidFrom || "—"}</td>

                  <td>
                    <strong>
                      {formatMoney(Number(expense.amount))}
                    </strong>
                  </td>
                </tr>
              ))}

              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No expenses found
                    {category ? ` for ${category}` : ""}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}