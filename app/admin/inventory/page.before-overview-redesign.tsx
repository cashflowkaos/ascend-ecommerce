import Link from "next/link";
import { PackagePlus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateInventoryProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  const totalUnits = products.reduce(
    (sum, product) => sum + product.inventoryQty,
    0
  );

  const lowStock = products.filter(
    (product) =>
      product.active &&
      product.trackInventory &&
      product.inventoryQty <= product.lowStockAt
  ).length;

  const purchasable = products.filter(
    (product) => product.purchasable
  ).length;

  return (
    <div>
      <div className="admin-page-heading admin-inventory-heading">
        <div>
          <span className="admin-eyebrow">CATALOG</span>
          <h1>Inventory</h1>
          <p>
            Manage member pricing, stock and product availability.
          </p>
        </div>

        <Link
          href="/admin/inventory/new"
          className="admin-primary-button"
        >
          <PackagePlus size={16} />
          Add Product
        </Link>
      </div>

      <section className="admin-inventory-summary">
        <div>
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>

        <div>
          <span>Total Units</span>
          <strong>{totalUnits}</strong>
        </div>

        <div>
          <span>Low Stock</span>
          <strong>{lowStock}</strong>
        </div>

        <div>
          <span>Purchasable</span>
          <strong>{purchasable}</strong>
        </div>
      </section>

      <section className="admin-panel admin-inventory-panel">
        <div className="admin-inventory-table-wrap">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Member Price</th>
                <th>Inventory</th>
                <th>Low At</th>
                <th>Active</th>
                <th>Purchasable</th>
                <th>Featured</th>
                <th>Save</th>
                <th>Edit</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const isLow =
                  product.trackInventory &&
                  product.inventoryQty <= product.lowStockAt;

                const formId = `inventory-${product.id}`;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-inventory-product">
                        <strong>{product.name}</strong>
                        <span>
                          {product.strength} · {product.category}
                        </span>
                      </div>

                      <form
                        id={formId}
                        action={updateInventoryProduct}
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={product.id}
                        />
                      </form>
                    </td>

                    <td>
                      <div className="admin-money-input">
                        <span>$</span>

                        <input
                          form={formId}
                          name="memberPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={
                            product.memberPrice?.toString() ?? ""
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </td>

                    <td>
                      <input
                        form={formId}
                        className={
                          isLow
                            ? "admin-number-input admin-number-input-low"
                            : "admin-number-input"
                        }
                        name="inventoryQty"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={product.inventoryQty}
                      />
                    </td>

                    <td>
                      <input
                        form={formId}
                        className="admin-number-input"
                        name="lowStockAt"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={product.lowStockAt}
                      />
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={formId}
                          type="checkbox"
                          name="active"
                          defaultChecked={product.active}
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={formId}
                          type="checkbox"
                          name="purchasable"
                          defaultChecked={product.purchasable}
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={formId}
                          type="checkbox"
                          name="featured"
                          defaultChecked={product.featured}
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <button
                        form={formId}
                        type="submit"
                        className="admin-save-button"
                      >
                        Save
                      </button>
                    </td>

                    <td>
                      <Link
                        href={`/admin/inventory/${product.id}`}
                        className="admin-edit-button"
                        title={`Edit ${product.name}`}
                      >
                        <Pencil size={15} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
