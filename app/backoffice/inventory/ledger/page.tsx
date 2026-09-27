import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function InventoryLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const params = await searchParams;

  const requestedLimit = Number(params.limit);
  const limit =
    Number.isInteger(requestedLimit) &&
    requestedLimit >= 110
      ? requestedLimit
      : 10;

  const movements =
    await prisma.backOfficeInventoryMovement.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      include: {
        location: {
          select: {
            name: true,
          },
        },
        batch: {
          select: {
            batchNumber: true,
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
    });

  const hasMore = movements.length > limit;
  const visibleMovements = movements.slice(0, limit);

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <p className="backoffice-eyebrow">
            INVENTORY
          </p>

          <h1>Inventory Ledger</h1>

          <p>
            Complete history of inventory activity,
            physical counts, adjustments, transfers,
            receiving, and sales.
          </p>
        </div>

        <Link
          href="/backoffice/inventory"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} />
          Back to Inventory
        </Link>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <p className="backoffice-eyebrow">
              RECENT ACTIVITY
            </p>

            <h2>Latest 10 Actions</h2>
          </div>
        </div>

        {visibleMovements.length === 0 ? (
          <p className="backoffice-count-empty">
            No inventory activity has been recorded yet.
          </p>
        ) : (
          <>
            <div className="backoffice-ledger-mobile">
              {visibleMovements.map((movement) => {
                const action =
                  movement.referenceType === "INVENTORY_AUDIT"
                    ? "Physical Count"
                    : movement.type.replaceAll("_", " ");

                return (
                  <div
                    className="backoffice-ledger-mobile-card"
                    key={movement.id}
                  >
                    <div className="backoffice-ledger-mobile-header">
                      <strong>{action}</strong>

                      <span>
                        {movement.createdAt.toLocaleString()}
                      </span>
                    </div>

                    <div className="backoffice-ledger-mobile-product">
                      <strong>
                        {movement.batch.product.name}
                      </strong>

                      <span>
                        {movement.batch.product.sku} Ãƒâ€šÃ‚Â· Batch{" "}
                        {movement.batch.batchNumber}
                      </span>
                    </div>

                    <div className="backoffice-ledger-mobile-meta">
                      <span>
                        <small>LOCATION</small>
                        <strong>{movement.location.name}</strong>
                      </span>

                      <span>
                        <small>INVENTORY</small>
                        <strong>
                          {movement.quantityBefore} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢{" "}
                          {movement.quantityAfter}
                        </strong>
                      </span>

                      <span>
                        <small>CHANGE</small>
                        <strong>
                          {movement.quantityDelta > 0
                            ? `+${movement.quantityDelta}`
                            : movement.quantityDelta}
                        </strong>
                      </span>
                    </div>

                    <div className="backoffice-ledger-mobile-footer">
                      <span>
                        <small>STAFF</small>
                        {movement.createdByName ?? "System"}
                      </span>

                      <span>
                        <small>NOTE</small>
                        {movement.note ?? "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="backoffice-table-wrap">
            <table className="backoffice-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Location</th>
                  <th>Action</th>
                  <th>Before</th>
                  <th>Change</th>
                  <th>After</th>
                  <th>Staff</th>
                  <th>Note</th>
                </tr>
              </thead>

              <tbody>
                {visibleMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      {movement.createdAt.toLocaleString()}
                    </td>

                    <td>
                      <strong>
                        {movement.batch.product.name}
                      </strong>
                      <br />
                      <small>
                        {movement.batch.product.sku}
                      </small>
                    </td>

                    <td>{movement.batch.batchNumber}</td>

                    <td>{movement.location.name}</td>

                    <td>
                      {movement.referenceType ===
                      "INVENTORY_AUDIT"
                        ? "Physical Count"
                        : movement.type.replaceAll("_", " ")}
                    </td>

                    <td>{movement.quantityBefore}</td>

                    <td>
                      {movement.quantityDelta > 0
                        ? `+${movement.quantityDelta}`
                        : movement.quantityDelta}
                    </td>

                    <td>{movement.quantityAfter}</td>

                    <td>
                      {movement.createdByName ?? "System"}
                    </td>

                    <td>{movement.note ?? "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        {hasMore && (
          <div className="backoffice-ledger-load-more">
            <Link
              href={`/backoffice/inventory/ledger?limit=${limit + 100}`}
              className="backoffice-secondary-button"
            >
              Load 100 More
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
