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
            purchaseReceiptItems: {
              select: {
                quantityReceived: true,
                physicalUnitCost: true,
                receipt: {
                  select: {
                    voidedAt: true,
                  },
                },
              },
            },
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

  const inventorySummary = products
    .filter((product) => product.inventoryType !== "NON_INVENTORY")
    .map((product) => {
      let quantity = 0;
      let value = 0;

      const catalogUnitCost =
        Number(product.cost ?? 0) /
        (product.inventoryType === "BATCHED"
          ? Math.max(1, product.unitsPerKit)
          : 1);

      if (product.inventoryType === "SIMPLE") {
        quantity = product.simpleBalances.reduce(
          (sum, balance) => sum + balance.quantity,
          0
        );

        value = quantity * catalogUnitCost;
      } else {
        for (const batch of product.batches) {
          const stock = batch.balances.reduce(
            (sum, balance) => sum + balance.quantity,
            0
          );

          quantity += stock;

          if (stock <= 0) continue;

          const receipts = batch.purchaseReceiptItems.filter(
            (receipt) =>
              !receipt.receipt.voidedAt &&
              receipt.physicalUnitCost !== null &&
              receipt.quantityReceived > 0
          );

          const receivedQuantity = receipts.reduce(
            (sum, receipt) => sum + receipt.quantityReceived,
            0
          );

          const unitCost =
            receivedQuantity > 0
              ? receipts.reduce(
                  (sum, receipt) =>
                    sum +
                    receipt.quantityReceived *
                      Number(receipt.physicalUnitCost),
                  0
                ) / receivedQuantity
              : catalogUnitCost;

          value += stock * unitCost;
        }
      }

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        quantity,
        value,
        unitCost: quantity > 0 ? value / quantity : catalogUnitCost,
      };
    });

  const lowStock = inventorySummary.filter(
    (product) =>
      product.quantity > 0 &&
      product.quantity <= 10
  );

  const outOfStock = inventorySummary.filter(
    (product) => product.quantity <= 0
  );

  const lowStockValue = lowStock.reduce(
    (sum, product) => sum + product.value,
    0
  );
  const totalBatches = products.reduce(
    (total, product) =>
      total + product.batches.length,
    0
  );

  const totalPhysicalUnits = inventorySummary.reduce(
    (sum, product) => sum + product.quantity,
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
          <span>Physical Units</span>
          <strong>{totalPhysicalUnits}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Locations</span>
          <strong>{locations.length}</strong>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="backoffice-panel" style={{ marginBottom: 0 }}>
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                INVENTORY ATTENTION
              </span>
              <h2>Low Stock</h2>
              <p>
                {lowStock.length} products at 10 units or fewer ·{" "}
                ${lowStockValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                remaining stock value
              </p>
            </div>
          </div>

          <div className="backoffice-table-wrap">
            <table className="backoffice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Unit Cost</th>
                  <th>Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No low-stock products.</td>
                  </tr>
                ) : (
                  lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <Link
                          href={`/backoffice/inventory/${product.id}`}
                        >
                          <strong>{product.name}</strong>
                          <br />
                          <span>{product.sku}</span>
                        </Link>
                      </td>
                      <td>
                        <strong>{product.quantity}</strong>
                      </td>
                      <td>
                        ${product.unitCost.toFixed(2)}
                      </td>
                      <td>
                        <strong>${product.value.toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="backoffice-panel" style={{ marginBottom: 0 }}>
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                INVENTORY ATTENTION
              </span>
              <h2>Out of Stock</h2>
              <p>
                {outOfStock.length} products currently have no physical
                inventory.
              </p>
            </div>
          </div>

          <div className="backoffice-table-wrap">
            <table className="backoffice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Unit Cost</th>
                  <th>Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {outOfStock.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No out-of-stock products.</td>
                  </tr>
                ) : (
                  outOfStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <Link
                          href={`/backoffice/inventory/${product.id}`}
                        >
                          <strong>{product.name}</strong>
                          <br />
                          <span>{product.sku}</span>
                        </Link>
                      </td>
                      <td>
                        <strong>{product.quantity}</strong>
                      </td>
                      <td>
                        ${product.unitCost.toFixed(2)}
                      </td>
                      <td>
                        <strong>${product.value.toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
