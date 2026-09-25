import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { setInitialInventoryCount } from "./actions";

export default async function BackOfficeInventoryPage() {
  const [products, locations] = await Promise.all([
    prisma.backOfficeProduct.findMany({
      where: { active: true },
      orderBy: {
        name: "asc",
      },
      include: {
        batches: {
          orderBy: [
            { receivedAt: "asc" },
            { createdAt: "asc" },
          ],
          include: {
            balances: true,
          },
        },
      },
    }),

    prisma.backOfficeLocation.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const totalBatches = products.reduce(
    (total, product) =>
      total + product.batches.length,
    0
  );

  const totalVials = products.reduce(
    (productTotal, product) =>
      productTotal +
      product.batches.reduce(
        (batchTotal, batch) =>
          batchTotal +
          batch.balances.reduce(
            (balanceTotal, balance) =>
              balanceTotal + balance.quantity,
            0
          ),
        0
      ),
    0
  );

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVENTORY
          </span>

          <h1>Inventory</h1>

          <p>
            Physical inventory by product, batch, and location.
          </p>
        </div>

        <Link
          href="/backoffice/inventory/new"
          className="backoffice-primary-button"
        >
          <Plus size={15} strokeWidth={2} />
          Add Product
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Batches</span>
          <strong>{totalBatches}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Total Vials</span>
          <strong>{totalVials}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Locations</span>
          <strong>{locations.length}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              CATALOG
            </span>

            <h2>Product Inventory</h2>
          </div>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Batches</th>

                {locations.map((location) => (
                  <th key={location.id}>
                    {location.name}
                  </th>
                ))}

                <th>Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const locationTotals = new Map(
                  locations.map((location) => [
                    location.id,
                    0,
                  ])
                );

                for (const batch of product.batches) {
                  for (const balance of batch.balances) {
                    locationTotals.set(
                      balance.locationId,
                      (locationTotals.get(
                        balance.locationId
                      ) ?? 0) + balance.quantity
                    );
                  }
                }

                const productTotal = Array.from(
                  locationTotals.values()
                ).reduce(
                  (total, quantity) =>
                    total + quantity,
                  0
                );

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.sku}</strong>
                    </td>

                    <td>{product.name}</td>

                    <td>{product.batches.length}</td>

                    {locations.map((location) => (
                      <td key={location.id}>
                        {locationTotals.get(
                          location.id
                        ) ?? 0}
                      </td>
                    ))}

                    <td>
                      <strong>{productTotal}</strong>
                    </td>

                    <td>
                      <Link
                        href={`/backoffice/inventory/${product.id}`}
                        className="backoffice-table-action"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="backoffice-panel backoffice-count-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PHYSICAL COUNT
            </span>

            <h2>Initial Inventory Count</h2>
          </div>
        </div>

        <p className="backoffice-intro">
          Enter the physical vial count for each batch at each
          location. Counts are recorded by batch and location
          and written to the inventory ledger.
        </p>

        <div className="backoffice-count-list">
          {products.map((product) => (
            <details
              className="backoffice-count-product"
              key={product.id}
            >
              <summary>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </div>

                <span>
                  {product.batches.length}{" "}
                  {product.batches.length === 1
                    ? "batch"
                    : "batches"}
                </span>
              </summary>

              <div className="backoffice-count-batches">
                {product.batches.length === 0 ? (
                  <p className="backoffice-count-empty">
                    No batches are currently assigned to this
                    product.
                  </p>
                ) : (
                  product.batches.map((batch) => (
                    <div
                      className="backoffice-count-batch"
                      key={batch.id}
                    >
                      <div className="backoffice-count-batch-heading">
                        <div>
                          <span>Batch</span>
                          <strong>
                            {batch.batchNumber}
                          </strong>
                        </div>

                        <span>
                          {batch.status}
                        </span>
                      </div>

                      <div className="backoffice-count-location-grid">
                        {locations.map((location) => {
                          const balance =
                            batch.balances.find(
                              (item) =>
                                item.locationId ===
                                location.id
                            );

                          const currentQuantity =
                            balance?.quantity ?? 0;

                          return (
                            <form
                              action={
                                setInitialInventoryCount
                              }
                              className="backoffice-count-form"
                              key={location.id}
                            >
                              <input
                                type="hidden"
                                name="batchId"
                                value={batch.id}
                              />

                              <input
                                type="hidden"
                                name="locationId"
                                value={location.id}
                              />

                              <label>
                                <span>{location.name}</span>

                                <input
                                  type="number"
                                  name="quantity"
                                  min="0"
                                  step="1"
                                  defaultValue={
                                    currentQuantity
                                  }
                                  required
                                />
                              </label>

                              <button type="submit">
                                Save Count
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}