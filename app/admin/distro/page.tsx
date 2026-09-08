import { prisma } from "@/lib/prisma";
import { createDistroItem, deleteDistroItem, updateDistroItem } from "./actions";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

export const dynamic = "force-dynamic";

function inputValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default async function DistroPage() {
  const products = await prisma.distroProduct.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      batches: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const enabledCount = products.filter(
    (product) => product.enabled
  ).length;

  const availableCount = products.filter(
    (product) => product.enabled && product.available
  ).length;

  return (
    <div className="admin-page admin-distro-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">ASCEND DISTRO</p>
          <h1>Distro Inventory</h1>
          <p className="admin-page-copy">
            Manage wholesale catalog pricing, batches, availability, and
            independent Distro stock.
          </p>
        </div>


      </div>

      <div className="admin-stat-grid admin-distro-stats">
        <div className="admin-stat-card">
          <span>Total Distro Items</span>
          <strong>{products.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Enabled</span>
          <strong>{enabledCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Available</span>
          <strong>{availableCount}</strong>
        </div>
      </div>

      <details className="admin-distro-add-panel" id="add-distro-item">
        <summary className="admin-distro-add-button">+ Add Inventory</summary>

        <form action={createDistroItem} className="admin-distro-add-form">
          <label>
            <span>Compound</span>
            <input
              name="name"
              type="text"
              placeholder="e.g. Retatrutide"
              required
            />
          </label>

          <label>
            <span>SKU</span>
            <input
              name="sku"
              type="text"
              placeholder="e.g. RT-40"
              required
            />
          </label>

          <label className="admin-distro-add-description">
            <span>Description</span>
            <input
              name="description"
              type="text"
                  placeholder="e.g. 40 mg / 3 mL / vial"
            />
          </label>

          <label>
            <span>Batch</span>
            <input
              name="batchNumber"
              type="text"
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Cost</span>
            <input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </label>

          <label>
            <span>Distro Stock</span>
            <input
              name="inventoryQty"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              required
            />
          </label>

          <div className="admin-distro-add-pricing">
            Tier pricing is generated automatically from cost.
          </div>

          <button type="submit" className="admin-distro-create-button">
            Add Item
          </button>
        </form>
      </details>



      <div className="admin-distro-table-wrap">
        <table className="admin-distro-table">
          <thead>
            <tr>
              <th>Compound</th>
              <th>Batch</th>
              <th>Cost</th>
              <th>Tier 1</th>
              <th>Tier 2</th>
              <th>Tier 3</th>
              <th>Distro Stock</th>
              <th>Enabled</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  No Distro products have been loaded yet.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const formId = `distro-${product.id}`;

                return (
                  <tr key={product.id}>
                     <td>
                      <div>
                        <input
                          form={formId}
                          name="name"
                          type="text"
                          defaultValue={product.name}
                          required
                        />
                      </div>

                      <div>
                        <input
                          form={formId}
                          name="sku"
                          type="text"
                          defaultValue={product.sku}
                          required
                        />
                      </div>

                      <div>
                        <input
                          form={formId}
                          name="description"
                          type="text"
                          defaultValue={product.description}
                        />
                      </div>
                    </td>

                    <td>
                      {product.batches.length > 0 ? (
                        product.batches.map((batch) => (
                          <div key={batch.id}>
                            <small>{batch.batchNumber}</small>
                          </div>
                        ))
                      ) : (
                        <small>-</small>
                      )}
                    </td>

                    <td>
                      <input
                        form={formId}
                        className="admin-money-input"
                        name="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={inputValue(product.cost)}
                      />
                    </td>

                    <td>
                      <input
                        form={formId}
                        className="admin-money-input"
                        name="tier1"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={inputValue(product.tier1Price)}
                      />
                    </td>

                    <td>
                      <input
                        form={formId}
                        className="admin-money-input"
                        name="tier2"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={inputValue(product.tier2Price)}
                      />
                    </td>

                    <td>
                      <input
                        form={formId}
                        className="admin-money-input"
                        name="tier3"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={inputValue(product.tier3Price)}
                      />
                    </td>

                    <td>
                      <input
                        form={formId}
                        className="admin-number-input"
                        name="inventoryQty"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={product.inventoryQty}
                      />
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={formId}
                          name="enabled"
                          type="checkbox"
                          defaultChecked={product.enabled}
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={formId}
                          name="available"
                          type="checkbox"
                          defaultChecked={product.available}
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <form id={formId} action={updateDistroItem}>
                        <input
                          type="hidden"
                          name="id"
                          value={product.id}
                        />
                        <button
                          className="admin-save-button"
                          type="submit"
                        >
                          Save
                        </button>
                      </form>

                      <form action={deleteDistroItem}>
                        <input
                          type="hidden"
                          name="id"
                          value={product.id}
                        />
                        <ConfirmDeleteButton />
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
