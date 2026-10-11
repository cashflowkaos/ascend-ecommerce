import { prisma } from "@/lib/prisma";
import { updateDistroSettings } from "./actions";

export const dynamic = "force-dynamic";

function money(value: number | null) {
  if (value === null) return "—";
  return `$${value.toFixed(2)}`;
}

export default async function DistroPage() {
  const products =
    await prisma.backOfficeProduct.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        distroProduct: {
          select: {
            id: true,
            enabled: true,
            available: true,
          },
        },
        batches: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            receivedAt: "asc",
          },
          include: {
            balances: {
              select: {
                quantity: true,
              },
            },
          },
        },
      },
    });

  const enabledCount = products.filter(
    (product) =>
      product.distroProduct?.enabled === true
  ).length;

  const availableCount = products.filter(
    (product) =>
      product.distroProduct?.enabled === true &&
      product.distroProduct?.available === true
  ).length;

  return (
    <div className="admin-page admin-distro-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            ASCEND DISTRO
          </p>

          <h1>Distro Catalog</h1>

          <p className="admin-page-copy">
            Products, pricing, batches, and physical stock are
            managed in Back Office. Control which products are
            available to Distro members here.
          </p>
        </div>
      </div>

      <div className="admin-stat-grid admin-distro-stats">
        <div className="admin-stat-card">
          <span>Total Products</span>
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

      <div className="admin-distro-table-wrap">
        <table className="admin-distro-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Kit Cost</th>
              <th>Tier 1</th>
              <th>Tier 2</th>
              <th>Tier 3</th>
              <th>Physical Stock</th>
              <th>Enabled</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  No Back Office products have been loaded yet.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const cost =
                  product.cost === null
                    ? null
                    : Number(product.cost);

                const tier1 =
                  cost === null
                    ? null
                    : Math.ceil(cost * 1.4);

                const tier2 =
                  cost === null
                    ? null
                    : Math.ceil(cost * 1.35);

                const tier3 =
                  cost === null
                    ? null
                    : Math.ceil(cost * 1.3);

                const physicalStock =
                  product.batches.reduce(
                    (productTotal, batch) =>
                      productTotal +
                      batch.balances.reduce(
                        (batchTotal, balance) =>
                          batchTotal + balance.quantity,
                        0
                      ),
                    0
                  );

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                      {product.description ? (
                        <small>
                          {product.description}
                        </small>
                      ) : null}
                    </td>

                    <td>
                      {product.batches.length > 0 ? (
                        product.batches.map((batch) => (
                          <small key={batch.id}>
                            {batch.batchNumber}
                          </small>
                        ))
                      ) : (
                        <small>—</small>
                      )}
                    </td>

                    <td>{money(cost)}</td>
                    <td>{money(tier1)}</td>
                    <td>{money(tier2)}</td>
                    <td>{money(tier3)}</td>

                    <td>
                      <strong>{physicalStock}</strong>
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={`distro-${product.id}`}
                          name="enabled"
                          type="checkbox"
                          defaultChecked={
                            product.distroProduct?.enabled ??
                            false
                          }
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          form={`distro-${product.id}`}
                          name="available"
                          type="checkbox"
                          defaultChecked={
                            product.distroProduct?.available ??
                            false
                          }
                        />
                        <span />
                      </label>
                    </td>

                    <td>
                      <form
                        id={`distro-${product.id}`}
                        action={updateDistroSettings}
                      >
                        <input
                          type="hidden"
                          name="backOfficeProductId"
                          value={product.id}
                        />

                        <button
                          className="admin-save-button"
                          type="submit"
                        >
                          Save
                        </button>
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
