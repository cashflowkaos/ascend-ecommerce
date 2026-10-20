import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import BackOfficeSaveButton from "@/components/backoffice/BackOfficeSaveButton";
import { prisma } from "@/lib/prisma";
import { updateBackOfficeExpense } from "../actions";

export const dynamic = "force-dynamic";

const categories = [
  "Inventory Purchases",
  "Shipping & Freight",
  "Packaging & Labels",
  "Lab Testing",
  "Bank & Payment Fees",
  "Software & Subscriptions",
  "Advertising & Marketing",
  "Office Supplies",
  "Rent / Lease",
  "Utilities",
  "Payroll / Contractors",
  "Insurance",
  "Taxes & Licenses",
  "Refunds",
  "Miscellaneous",
  "Inventory",
  "Shipping",
  "Packaging",
  "Supplies",
  "Lab Test",
  "Bank/Wire Fees",
  "Other",
];

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function BackOfficeExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const expense = await prisma.backOfficeExpense.findUnique({
    where: { id },
  });

  if (!expense) {
    notFound();
  }

  const categoryOptions = categories.includes(expense.category)
    ? categories
    : [expense.category, ...categories];

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            EXPENSES / EXPENSE
          </span>
          <h1>{expense.description || expense.category}</h1>
          <p>
            Review or update this business expense.
            {expense.legacyId !== null
              ? ` Migrated legacy expense #${expense.legacyId}.`
              : ""}
          </p>
        </div>

        <Link
          href="/backoffice/expenses"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Expenses
        </Link>
      </div>

      <form
        action={updateBackOfficeExpense}
        className="backoffice-panel backoffice-product-form"
      >
        <input type="hidden" name="id" value={expense.id} />

        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              EXPENSE DETAILS
            </span>
            <h2>Expense Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>Date</span>
            <input
              type="date"
              name="expenseDate"
              defaultValue={dateInputValue(expense.expenseDate)}
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Category</span>
            <select
              name="category"
              defaultValue={expense.category}
              required
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="backoffice-form-field">
            <span>Vendor</span>
            <input
              type="text"
              name="vendor"
              defaultValue={expense.vendor ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Amount</span>
            <input
              type="number"
              name="amount"
              step="0.01"
              defaultValue={Number(expense.amount)}
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Description</span>
            <input
              type="text"
              name="description"
              defaultValue={expense.description ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Paid From</span>
            <input
              type="text"
              name="paidFrom"
              defaultValue={expense.paidFrom ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={expense.notes ?? ""}
            />
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/expenses"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <BackOfficeSaveButton />
        </div>
      </form>
    </>
  );
}