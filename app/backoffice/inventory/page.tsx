import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import BackOfficeInventoryRow from "@/components/backoffice/BackOfficeInventoryRow";

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
        simpleBalances: true,
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href="/backoffice/inventory/ledger"
            className="backoffice-secondary-button"
          >
            Inventory Ledger
          </Link>
          <Link
            href="/backoffice/inventory/transfers"
            className="backoffice-secondary-button"
          >
            Transfers
          </Link>
          <Link
            href="/backoffice/inventory/count"
            className="backoffice-secondary-button"
          >
            Physical Count
          </Link>

        <Link
          href="/backoffice/inventory/new"
          className="backoffice-primary-button"
        >
          <Plus size={15} strokeWidth={2} />
          Add Product
        </Link>
        </div>
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

                if (product.inventoryType === "SIMPLE") {
                  for (const balance of product.simpleBalances) {
                    locationTotals.set(
                      balance.locationId,
                      balance.quantity
                    );
                  }
                } else if (product.inventoryType === "BATCHED") {
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
                }
                const productTotal = Array.from(
                  locationTotals.values()
                ).reduce(
                  (total, quantity) =>
                    total + quantity,
                  0
                );

                return (
                  <BackOfficeInventoryRow productId={product.id}>
                    <td>
                      <strong>{product.sku}</strong>
                    </td>

                    <td>{product.name}</td>

                    <td>
                      {product.inventoryType === "BATCHED"
                        ? product.batches.length
                        : "—"}
                    </td>

                    {locations.map((location) => (
                      <td key={location.id}>
                        {product.inventoryType === "NON_INVENTORY"
                          ? "—"
                          : locationTotals.get(location.id) ?? 0}
                      </td>
                    ))}

                    <td>
                      <strong>
                        {product.inventoryType === "NON_INVENTORY"
                          ? "—"
                          : productTotal}
                      </strong>
                    </td>
                  </BackOfficeInventoryRow>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="backoffice-inventory-compact">
          {products.map((product) => {
            const locationTotals = new Map(
              locations.map((location) => [
                location.id,
                0,
              ])
            );

            if (product.inventoryType === "SIMPLE") {
              for (const balance of product.simpleBalances) {
                locationTotals.set(
                  balance.locationId,
                  balance.quantity
                );
              }
            } else if (product.inventoryType === "BATCHED") {
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
            }
            const productTotal = Array.from(
              locationTotals.values()
            ).reduce(
              (total, quantity) => total + quantity,
              0
            );

            return (
              <Link
                key={product.id}
                href={`/backoffice/inventory/${product.id}`}
                className="backoffice-inventory-compact-row"
              >
                <div className="backoffice-inventory-compact-product">
                  <strong>{product.name}</strong>
                  <span>
                    {product.sku}
                    {product.inventoryType === "BATCHED" && (
                      <>
                        {" · "}
                        {product.batches.length}{" "}
                        {product.batches.length === 1 ? "batch" : "batches"}
                      </>
                    )}
                  </span>
                </div>

                <div className="backoffice-inventory-compact-stock">
                  {locations.map((location) => (
                    <div key={location.id}>
                      <span>{location.name}</span>
                      <strong>
                        {product.inventoryType === "NON_INVENTORY"
                          ? "—"
                          : locationTotals.get(location.id) ?? 0}
                      </strong>
                    </div>
                  ))}

                  <div className="backoffice-inventory-compact-total">
                    <span>Total</span>
                    <strong>
                      {product.inventoryType === "NON_INVENTORY"
                        ? "—"
                        : productTotal}
                    </strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </>
  );
}
