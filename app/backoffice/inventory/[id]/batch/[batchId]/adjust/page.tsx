import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { adjustBackOfficeInventory } from "../../../../actions";

export const dynamic = "force-dynamic";

export default async function AdjustInventoryPage({
  params,
}: {
  params: Promise<{
    id: string;
    batchId: string;
  }>;
}) {
  const { id, batchId } = await params;

  const [product, locations] = await Promise.all([
    prisma.backOfficeProduct.findUnique({
      where: { id },
      include: {
        batches: {
          where: {
            id: batchId,
          },
          include: {
            balances: true,
          },
        },
      },
    }),

    prisma.backOfficeLocation.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),
  ]);

  const batch = product?.batches[0];

  if (!product || !batch) {
    notFound();
  }

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            INVENTORY / ADJUSTMENT
          </span>

          <h1>Adjust Inventory</h1>

          <p>
            {product.name} · Batch {batch.batchNumber}
          </p>
        </div>

        <Link
          href={`/backoffice/inventory/${product.id}`}
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Product
        </Link>
      </div>

      <div className="backoffice-adjust-page-grid">
        {locations.map((location) => {
          const currentQuantity =
            batch.balances.find(
              (balance) =>
                balance.locationId === location.id
            )?.quantity ?? 0;

          return (
            <section
              key={location.id}
              className="backoffice-panel backoffice-adjust-page-card"
            >
              <div className="backoffice-adjust-page-card-header">
                <div>
                  <span className="backoffice-eyebrow">
                    LOCATION
                  </span>

                  <h2>{location.name}</h2>
                </div>

                <div className="backoffice-adjust-current">
                  <span>Current Inventory</span>
                  <strong>{currentQuantity}</strong>
                  <small>vials</small>
                </div>
              </div>

              <form
                action={adjustBackOfficeInventory}
                className="backoffice-adjust-page-form"
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

                <label className="backoffice-form-field">
                  <span>Adjustment</span>

                  <input
                    type="number"
                    name="adjustment"
                    step="1"
                    placeholder="+5 or -2"
                    required
                  />

                  <small>
                    Use a positive number to add vials or
                    a negative number to remove vials.
                  </small>
                </label>

                <label className="backoffice-form-field">
                  <span>Reason</span>

                  <input
                    type="text"
                    name="note"
                    placeholder="Example: physical count correction"
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="backoffice-primary-button"
                >
                  Save Adjustment
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </>
  );
}