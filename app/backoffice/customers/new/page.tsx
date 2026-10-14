import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBackOfficeCustomer } from "../actions";

export default function NewBackOfficeCustomerPage() {
  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            CUSTOMERS / NEW CUSTOMER
          </span>

          <h1>Add Customer</h1>

          <p>
            Create a customer for POS, wholesale, distro, or
            future website membership.
          </p>
        </div>

        <Link
          href="/backoffice/customers"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Customers
        </Link>
      </div>

      <form
        action={createBackOfficeCustomer}
        className="backoffice-panel backoffice-product-form"
      >
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              CUSTOMER DETAILS
            </span>

            <h2>Customer Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>First Name</span>
            <input
              type="text"
              name="firstName"
              autoComplete="off"
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Last Name</span>
            <input
              type="text"
              name="lastName"
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Company</span>
            <input
              type="text"
              name="company"
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Pricing</span>
            <select name="pricingType" defaultValue="RETAIL">
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="TIER_1">Tier 1</option>
              <option value="TIER_2">Tier 2</option>
              <option value="TIER_3">Tier 3</option>
            </select>
          </label>

          <label className="backoffice-form-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Phone</span>
            <input
              type="text"
              name="phone"
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Notes</span>
            <textarea name="notes" rows={4} />
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/customers"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="backoffice-primary-button"
          >
            Create Customer
          </button>
        </div>
      </form>
    </>
  );
}
