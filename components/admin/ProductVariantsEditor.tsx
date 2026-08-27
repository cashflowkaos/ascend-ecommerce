import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
} from "@/app/admin/inventory/variant-actions";

type Variant = {
  id: string;
  strength: string;
  sku: string | null;
  memberPrice: string | null;
  inventoryQty: number;
  lowStockAt: number;
  active: boolean;
  purchasable: boolean;
  sortOrder: number;
};

type ProductVariantsEditorProps = {
  productId: string;
  variants: Variant[];
};

export default function ProductVariantsEditor({
  productId,
  variants,
}: ProductVariantsEditorProps) {
  return (
    <section className="admin-editor-section">
      <div className="admin-editor-section-heading">
        <span className="admin-eyebrow">MEMBER COMMERCE</span>
        <h2>Strength Options</h2>
        <p>
          Manage strength, member pricing, inventory and purchasing
          availability for each option.
        </p>
      </div>

      <div className="admin-variant-editor-list">
        {variants.map((variant) => (
          <form
            key={variant.id}
            action={updateProductVariant}
            className="admin-variant-editor-card"
          >
            <input
              type="hidden"
              name="variantId"
              value={variant.id}
            />

            <label className="admin-field">
              <span>Strength *</span>
              <input
                name="strength"
                required
                defaultValue={variant.strength}
                placeholder="10 mg"
              />
            </label>

            <label className="admin-field">
              <span>SKU</span>
              <input
                name="sku"
                defaultValue={variant.sku ?? ""}
                placeholder="Optional"
              />
            </label>

            <label className="admin-field">
              <span>Member Price</span>
              <input
                name="memberPrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={variant.memberPrice ?? ""}
                placeholder="0.00"
              />
            </label>

            <label className="admin-field">
              <span>Inventory</span>
              <input
                name="inventoryQty"
                type="number"
                min="0"
                step="1"
                defaultValue={variant.inventoryQty}
              />
            </label>

            <label className="admin-field">
              <span>Low Stock At</span>
              <input
                name="lowStockAt"
                type="number"
                min="0"
                step="1"
                defaultValue={variant.lowStockAt}
              />
            </label>

            <label className="admin-field">
              <span>Sort Order</span>
              <input
                name="sortOrder"
                type="number"
                min="0"
                step="1"
                defaultValue={variant.sortOrder}
              />
            </label>

            <div className="admin-editor-switches">
              <label className="admin-editor-toggle">
                <div>
                  <strong>Active</strong>
                  <span>
                    Make this strength available in the catalog.
                  </span>
                </div>

                <label className="admin-switch">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={variant.active}
                  />
                  <span />
                </label>
              </label>

              <label className="admin-editor-toggle">
                <div>
                  <strong>Purchasable</strong>
                  <span>
                    Allow members to purchase this strength.
                  </span>
                </div>

                <label className="admin-switch">
                  <input
                    type="checkbox"
                    name="purchasable"
                    defaultChecked={variant.purchasable}
                  />
                  <span />
                </label>
              </label>
            </div>

            <div className="admin-variant-editor-actions">
              <button
                type="submit"
                className="admin-primary-button"
              >
                Save Strength
              </button>

              <button
                type="submit"
                formAction={deleteProductVariant}
                className="admin-secondary-button"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>

      <form
        action={createProductVariant}
        className="admin-variant-add-card"
      >
        <input
          type="hidden"
          name="productId"
          value={productId}
        />

        <div className="admin-editor-section-heading">
          <span className="admin-eyebrow">ADD OPTION</span>
          <h3>Add Strength</h3>
        </div>

        <div className="admin-editor-grid">
          <label className="admin-field">
            <span>Strength *</span>
            <input
              name="strength"
              required
              placeholder="20 mg"
            />
          </label>

          <label className="admin-field">
            <span>SKU</span>
            <input
              name="sku"
              placeholder="Optional"
            />
          </label>

          <label className="admin-field">
            <span>Member Price</span>
            <input
              name="memberPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </label>

          <label className="admin-field">
            <span>Inventory</span>
            <input
              name="inventoryQty"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
            />
          </label>

          <label className="admin-field">
            <span>Low Stock At</span>
            <input
              name="lowStockAt"
              type="number"
              min="0"
              step="1"
              defaultValue={5}
            />
          </label>

          <label className="admin-field">
            <span>Sort Order</span>
            <input
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
            />
          </label>
        </div>

        <input
          type="hidden"
          name="active"
          value="on"
        />

        <input
          type="hidden"
          name="purchasable"
          value="on"
        />

        <div className="admin-variant-editor-actions">
          <button
            type="submit"
            className="admin-primary-button"
          >
            Add Strength
          </button>
        </div>
      </form>
    </section>
  );
}