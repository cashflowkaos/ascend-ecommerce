import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBackOfficeExpense } from "../actions";

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

export default function NewBackOfficeExpensePage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            EXPENSES / NEW EXPENSE
          </span>
          <h1>Add Expense</h1>
          <p>Record a new business expense.</p>
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
        action={createBackOfficeExpense}
        className="backoffice-panel backoffice-product-form"
      >
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
              defaultValue={today}
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Category</span>
            <select
              name="category"
              defaultValue="Inventory Purchases"
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="backoffice-form-field">
            <span>Vendor</span>
            <input type="text" name="vendor" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Amount</span>
            <input
              type="number"
              name="amount"
              step="0.01"
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Description</span>
            <input
              type="text"
              name="description"
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Paid From</span>
            <input
              type="text"
              name="paidFrom"
              autoComplete="off"
              placeholder="Bank, cash, card, etc."
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Notes</span>
            <textarea name="notes" rows={4} />
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/expenses"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="backoffice-primary-button"
          >
            Create Expense
          </button>
        </div>
      </form>
    </>
  );
}