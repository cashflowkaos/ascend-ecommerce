import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBackOfficeSupplier } from "../actions";

export default function NewBackOfficeSupplierPage() {
  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">SUPPLIERS / NEW SUPPLIER</span>
          <h1>Add Supplier</h1>
          <p>Add a vendor that Ascend purchases inventory or supplies from.</p>
        </div>

        <Link
          href="/backoffice/suppliers"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Suppliers
        </Link>
      </div>

      <form
        action={createBackOfficeSupplier}
        className="backoffice-panel backoffice-product-form"
      >
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">SUPPLIER DETAILS</span>
            <h2>Supplier Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>Supplier Name</span>
            <input type="text" name="name" required autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Contact Name</span>
            <input type="text" name="contactName" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Phone</span>
            <input type="tel" name="phone" autoComplete="off" />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Website</span>
            <input
              type="text"
              name="website"
              autoComplete="off"
              placeholder="https://..."
            />
          </label>

          <label className="backoffice-form-field">
            <span>Address</span>
            <input type="text" name="addressLine1" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Address Line 2</span>
            <input type="text" name="addressLine2" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>City</span>
            <input type="text" name="city" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>State / Province</span>
            <input type="text" name="state" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Postal Code</span>
            <input type="text" name="postalCode" autoComplete="off" />
          </label>

          <label className="backoffice-form-field">
            <span>Country</span>
            <input
              type="text"
              name="country"
              defaultValue="United States"
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Notes</span>
            <textarea name="notes" rows={4} />
          </label>

          <label className="backoffice-form-field">
            <span>Status</span>
            <span>
              <input
                type="checkbox"
                name="active"
                defaultChecked
                style={{ width: "auto", marginRight: 8 }}
              />
              Active supplier
            </span>
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/suppliers"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <button type="submit" className="backoffice-primary-button">
            Create Supplier
          </button>
        </div>
      </form>
    </>
  );
}