type ProductEditorValues = {
  id?: string;
  slug?: string;
  sku?: string | null;
  name?: string;
  strength?: string;
  category?: string;
  image?: string | null;
  overview?: string;
  composition?: unknown;
  presentation?: string;
  storage?: string;
  researchNotice?: string | null;
  featured?: boolean;
  active?: boolean;
  purchasable?: boolean;
  trackInventory?: boolean;
  sortOrder?: number;
};

type ProductEditorProps = {
  product?: ProductEditorValues;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

function compositionToText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export default function ProductEditor({
  product,
  action,
  submitLabel,
}: ProductEditorProps) {
  return (
    <form action={action} className="admin-product-editor">
      {product?.id && (
        <input type="hidden" name="id" value={product.id} />
      )}

      <section className="admin-editor-section">
        <div className="admin-editor-section-heading">
          <span className="admin-eyebrow">IDENTITY</span>
          <h2>Product Information</h2>
          <p>
            Core information used throughout the Ascend catalog.
          </p>
        </div>

        <div className="admin-editor-grid">
          <label className="admin-field admin-field-wide">
            <span>Product Name *</span>
            <input
              name="name"
              required
              defaultValue={product?.name ?? ""}
              placeholder="BPC-157"
            />
          </label>

          <label className="admin-field">
            <span>Strength *</span>
            <input
              name="strength"
              required
              defaultValue={product?.strength ?? ""}
              placeholder="10 mg"
            />
          </label>

          <label className="admin-field">
            <span>Category *</span>
            <input
              name="category"
              required
              defaultValue={product?.category ?? "Research Peptide"}
              placeholder="Research Peptide"
            />
          </label>

          <label className="admin-field">
            <span>Slug *</span>
            <input
              name="slug"
              required
              defaultValue={product?.slug ?? ""}
              placeholder="bpc157"
            />
            <small>
              Website URL identifier. Use lowercase letters, numbers and hyphens.
            </small>
          </label>

          <label className="admin-field">
            <span>SKU</span>
            <input
              name="sku"
              defaultValue={product?.sku ?? ""}
              placeholder="Optional"
            />
          </label>

          <label className="admin-field admin-field-full">
            <span>Image Path</span>
            <input
              name="image"
              defaultValue={product?.image ?? ""}
              placeholder="/images/products/bpc157.png"
            />
            <small>
              We will add image upload controls later. Existing public image paths work now.
            </small>
          </label>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section-heading">
          <span className="admin-eyebrow">WEBSITE CONTENT</span>
          <h2>Research Information</h2>
          <p>
            Edit the information displayed on the public compound page.
          </p>
        </div>

        <div className="admin-editor-grid">
          <label className="admin-field admin-field-full">
            <span>Overview *</span>
            <textarea
              name="overview"
              required
              rows={7}
              defaultValue={product?.overview ?? ""}
              placeholder="Research overview..."
            />
          </label>

          <label className="admin-field admin-field-full">
            <span>Composition</span>
            <textarea
              name="composition"
              rows={7}
              defaultValue={compositionToText(product?.composition)}
              placeholder={'{\n  "compound": "Example"\n}'}
            />
            <small>
              Stored as structured JSON. Leave blank if the product does not use composition data.
            </small>
          </label>

          <label className="admin-field admin-field-wide">
            <span>Presentation *</span>
            <textarea
              name="presentation"
              required
              rows={4}
              defaultValue={product?.presentation ?? "Lyophilized Powder"}
              placeholder="Product presentation..."
            />
          </label>

          <label className="admin-field admin-field-wide">
            <span>Storage *</span>
            <textarea
              name="storage"
              required
              rows={4}
              defaultValue={product?.storage ?? "Store refrigerated. Protect from light."}
              placeholder="Storage information..."
            />
          </label>

          <label className="admin-field admin-field-full">
            <span>Research Notice</span>
            <textarea
              name="researchNotice"
              rows={4}
              defaultValue={
                product?.researchNotice ??
                "For laboratory research use only. Not for human consumption."
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section-heading">
          <span className="admin-eyebrow">CATALOG</span>
          <h2>Catalog Settings</h2>
          <p>
            Controls product visibility, purchasing availability and catalog behavior.
          </p>
        </div>

        <div className="admin-editor-grid">
          <label className="admin-field">
            <span>Sort Order</span>
            <input
              name="sortOrder"
              type="number"
              step="1"
              defaultValue={product?.sortOrder ?? 0}
            />
            <small>
              Controls the product position in catalog listings.
            </small>
          </label>
        </div>

        <div className="admin-editor-switches">
          <label className="admin-editor-toggle">
            <div>
              <strong>Active</strong>
              <span>Show this product in the Ascend catalog.</span>
            </div>

            <label className="admin-switch">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product?.active ?? true}
              />
              <span />
            </label>
          </label>

          <label className="admin-editor-toggle">
            <div>
              <strong>Purchasable</strong>
              <span>
                Allow approved members to purchase this product when member commerce is enabled.
              </span>
            </div>

            <label className="admin-switch">
              <input
                type="checkbox"
                name="purchasable"
                defaultChecked={product?.purchasable ?? false}
              />
              <span />
            </label>
          </label>

          <label className="admin-editor-toggle">
            <div>
              <strong>Featured</strong>
              <span>Feature this product in highlighted catalog areas.</span>
            </div>

            <label className="admin-switch">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
              />
              <span />
            </label>
          </label>

          <label className="admin-editor-toggle">
            <div>
              <strong>Track Inventory</strong>
              <span>Include this product in inventory and low-stock tracking.</span>
            </div>

            <label className="admin-switch">
              <input
                type="checkbox"
                name="trackInventory"
                defaultChecked={product?.trackInventory ?? true}
              />
              <span />
            </label>
          </label>
        </div>
      </section>

      <div className="admin-editor-footer">
        <a href="/admin/inventory" className="admin-secondary-button">
          Cancel
        </a>

        <button type="submit" className="admin-primary-button">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
