import { prisma } from "@/lib/prisma";

export default async function BackOfficeInventoryPage() {
  const [products, locations] = await Promise.all([
    prisma.backOfficeProduct.findMany({
      where: { active: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
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
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Batches</span>
          <strong>
            {products.reduce(
              (total, product) =>
                total + product.batches.length,
              0
            )}
          </strong>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}