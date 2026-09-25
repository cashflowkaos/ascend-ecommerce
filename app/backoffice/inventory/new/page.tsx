import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBackOfficeProduct } from "../actions";

export default function NewBackOfficeProductPage() {
  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVENTORY
          </span>

          <h1>Add Product</h1>

          <p>
            Add a new product to the Back Office catalog.
          </p>
        </div>

        <Link
          href="/backoffice/inventory"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Inventory
        </Link>
      </div>

      <form
        action={createBackOfficeProduct}
        className="backoffice-panel backoffice-product-form"
      >
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PRODUCT DETAILS
            </span>

            <h2>Product Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>SKU</span>

            <input
              type="text"
              name="sku"
              placeholder="RETA-30"
              autoComplete="off"
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Product Name</span>

            <input
              type="text"
              name="name"
              placeholder="Retatrutide 30 mg"
              autoComplete="off"
              required
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Description</span>

            <textarea
              name="description"
              rows={4}
              placeholder="Product description"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Vials Per Kit</span>

            <input
              type="number"
              name="unitsPerKit"
              min="1"
              step="1"
              defaultValue="10"
              required
            />

            <small>
              Physical inventory is always tracked in individual
              vials. This controls kit conversion.
            </small>
          </label>

          <label className="backoffice-form-field">
            <span>Initial Batch Number</span>

            <input
              type="text"
              name="batchNumber"
              placeholder="Optional"
              autoComplete="off"
            />

            <small>
              Leave blank if the batch will be added later.
            </small>
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/inventory"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="backoffice-primary-button"
          >
            Add Product
          </button>
        </div>
      </form>
    </>
  );
}