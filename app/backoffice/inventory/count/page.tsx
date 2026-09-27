import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { setInitialInventoryCount } from "../actions";

export default async function BackOfficeInventoryCountPage() {
  const [products, locations] = await Promise.all([
    prisma.backOfficeProduct.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
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

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVENTORY
          </span>

          <h1>Physical Count</h1>

          <p>
            Record the physical vial count for each batch at each
            inventory location.
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

      <div className="backoffice-panel backoffice-count-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PHYSICAL COUNT
            </span>

            <h2>Inventory Count</h2>
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
                          <strong>{batch.batchNumber}</strong>
                        </div>

                        <span>{batch.status}</span>
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
                              action={setInitialInventoryCount}
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
                                  defaultValue={currentQuantity}
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
