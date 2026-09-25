import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import BatchCoaUpload from "@/components/backoffice/BatchCoaUpload";
import { prisma } from "@/lib/prisma";
import {
  addBackOfficeBatch,
  adjustBackOfficeInventory,
  setBackOfficeBatchStatus,
  updateBackOfficeProduct,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function EditBackOfficeProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product =
    await prisma.backOfficeProduct.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: [
            { receivedAt: "asc" },
            { createdAt: "asc" },
          ],
          include: {
            balances: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

  if (!product) {
    notFound();
  }

  const locations =
    await prisma.backOfficeLocation.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVENTORY / EDIT PRODUCT
          </span>

          <h1>{product.name}</h1>

          <p>
            Manage product information, packaging, and batches.
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

      <form
        action={updateBackOfficeProduct}
        className="backoffice-panel backoffice-product-form"
      >
        <input
          type="hidden"
          name="id"
          value={product.id}
        />

        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PRODUCT DETAILS
            </span>

            <h2>Product Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>SKU</span>

            <input
              type="text"
              name="sku"
              defaultValue={product.sku}
              autoComplete="off"
              required
            />
          </label>

          <label className="backoffice-form-field">
            <span>Product Name</span>

            <input
              type="text"
              name="name"
              defaultValue={product.name}
              autoComplete="off"
              required
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Description</span>

            <textarea
              name="description"
              rows={4}
              defaultValue={product.description}
            />
          </label>

          <label className="backoffice-form-field">
            <span>Vials Per Kit</span>

            <input
              type="number"
              name="unitsPerKit"
              min="1"
              step="1"
              defaultValue={product.unitsPerKit}
              required
            />

            <small>
              Physical inventory remains tracked in individual
              vials. This controls vial-to-kit conversion.
            </small>
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/inventory"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="backoffice-primary-button"
          >
            Save Product
          </button>
        </div>
      </form>

      <div className="backoffice-panel backoffice-product-batches-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              BATCHES
            </span>

            <h2>
              Batch History ({product.batches.length})
            </h2>
          </div>
        </div>

        <form
          action={addBackOfficeBatch}
          className="backoffice-add-batch-form"
        >
          <input
            type="hidden"
            name="productId"
            value={product.id}
          />

          <label className="backoffice-form-field">
            <span>Add New Batch</span>

            <input
              type="text"
              name="batchNumber"
              placeholder="Enter batch number"
              autoComplete="off"
              required
            />
          </label>

          <button
            type="submit"
            className="backoffice-primary-button"
          >
            Add Batch
          </button>
        </form>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Status</th>
                <th>Received</th>
                <th>Hub</th>
                <th>Satellite</th>
                <th>Total Vials</th>
                <th>COA</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {product.batches.map((batch) => {
                const hub =
                  batch.balances.find(
                    (balance) =>
                      balance.location.code === "HUB"
                  )?.quantity ?? 0;

                const satellite =
                  batch.balances.find(
                    (balance) =>
                      balance.location.code ===
                      "SATELLITE"
                  )?.quantity ?? 0;

                return (
                                    <>
                    <tr key={batch.id}>
                      <td>
                        <strong>{batch.batchNumber}</strong>
                      </td>

                      <td>{batch.status}</td>

                      <td>
                        {batch.receivedAt.toLocaleDateString()}
                      </td>

                      <td>{hub}</td>
                      <td>{satellite}</td>

                      <td>
                        <strong>{hub + satellite}</strong>
                      </td>

                      <td>
                        <BatchCoaUpload
                          batchId={batch.id}
                          productId={product.id}
                          coaUrl={batch.coaUrl}
                        />
                      </td>

                      <td>
                        <div className="backoffice-batch-actions">
                          <Link
  href={`/backoffice/inventory/${product.id}/batch/${batch.id}/adjust`}
  className="backoffice-adjust-trigger"
>
  Adjust
</Link>

                          <form
                            action={setBackOfficeBatchStatus}
                          >
                            <input
                              type="hidden"
                              name="batchId"
                              value={batch.id}
                            />

                            <input
                              type="hidden"
                              name="productId"
                              value={product.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value={
                                batch.status === "ACTIVE"
                                  ? "RETIRED"
                                  : "ACTIVE"
                              }
                            />

                            <button
                              type="submit"
                              className="backoffice-table-action-button"
                            >
                              {batch.status === "ACTIVE"
                                ? "Retire"
                                : "Reactivate"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })}

              {product.batches.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    No batches have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="backoffice-mobile-batches">
          {product.batches.map((batch) => {
            const hub =
              batch.balances.find(
                (balance) =>
                  balance.location.code === "HUB"
              )?.quantity ?? 0;

            const satellite =
              batch.balances.find(
                (balance) =>
                  balance.location.code === "SATELLITE"
              )?.quantity ?? 0;

            return (
              <article
                key={batch.id}
                className="backoffice-mobile-batch-card"
              >
                <div className="backoffice-mobile-batch-header">
                  <div>
                    <span>Batch</span>
                    <strong>{batch.batchNumber}</strong>
                  </div>

                  <span
                    className={`backoffice-mobile-batch-status ${
                      batch.status === "ACTIVE"
                        ? "is-active"
                        : "is-retired"
                    }`}
                  >
                    {batch.status === "ACTIVE"
                      ? "Active"
                      : "Retired"}
                  </span>
                </div>

                <div className="backoffice-mobile-batch-received">
                  Received{" "}
                  {batch.receivedAt.toLocaleDateString()}
                </div>

                <div className="backoffice-mobile-stock-grid">
                  <div>
                    <span>Hub</span>
                    <strong>{hub}</strong>
                  </div>

                  <div>
                    <span>Satellite</span>
                    <strong>{satellite}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>{hub + satellite}</strong>
                  </div>
                </div>

                <div className="backoffice-mobile-batch-section">
                  <span className="backoffice-mobile-batch-label">
                    COA
                  </span>

                  <BatchCoaUpload
                    batchId={batch.id}
                    productId={product.id}
                    coaUrl={batch.coaUrl}
                  />
                </div>

                <div className="backoffice-mobile-batch-actions">
                  <Link
                    href={`/backoffice/inventory/${product.id}/batch/${batch.id}/adjust`}
                    className="backoffice-adjust-trigger"
                  >
                    Adjust Inventory
                  </Link>

                  <form
                    action={setBackOfficeBatchStatus}
                  >
                    <input
                      type="hidden"
                      name="batchId"
                      value={batch.id}
                    />

                    <input
                      type="hidden"
                      name="productId"
                      value={product.id}
                    />

                    <input
                      type="hidden"
                      name="status"
                      value={
                        batch.status === "ACTIVE"
                          ? "RETIRED"
                          : "ACTIVE"
                      }
                    />

                    <button
                      type="submit"
                      className="backoffice-table-action-button"
                    >
                      {batch.status === "ACTIVE"
                        ? "Retire Batch"
                        : "Reactivate Batch"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}

          {product.batches.length === 0 && (
            <div className="backoffice-mobile-batch-empty">
              No batches have been added yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
