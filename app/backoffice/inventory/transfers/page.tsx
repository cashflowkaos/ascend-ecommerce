import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import InventoryTransferForm from "./InventoryTransferForm";

export default async function InventoryTransfersPage() {
  const [products, locations, recentTransfers] =
    await Promise.all([
      prisma.backOfficeProduct.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          sku: true,
          name: true,
          batches: {
            where: {
              status: "ACTIVE",
            },
            orderBy: [
              { receivedAt: "asc" },
              { createdAt: "asc" },
            ],
            select: {
              id: true,
              batchNumber: true,
              balances: {
                select: {
                  locationId: true,
                  quantity: true,
                },
              },
            },
          },
        },
      }),

      prisma.backOfficeLocation.findMany({
        where: {
          active: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),

      prisma.backOfficeInventoryTransfer.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          quantity: true,
          status: true,
          note: true,
          createdByName: true,
          createdAt: true,
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
          fromLocation: {
            select: {
              name: true,
            },
          },
          toLocation: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <p className="backoffice-eyebrow">
            INVENTORY
          </p>

          <h1>Inventory Transfers</h1>

          <p>
            Move physical inventory between Back Office locations.
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
              NEW TRANSFER
            </p>

            <h2>Transfer Inventory</h2>
          </div>
        </div>

        <InventoryTransferForm
          products={products}
          locations={locations}
        />
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <p className="backoffice-eyebrow">
              TRANSFER HISTORY
            </p>

            <h2>Recent Transfers</h2>
          </div>
        </div>

        {recentTransfers.length === 0 ? (
          <p className="backoffice-count-empty">
            No inventory transfers have been recorded yet.
          </p>
        ) : (
          <div>
            {recentTransfers.map((transfer) => (
              <p key={transfer.id}>
                {transfer.batch.product.name} ·{" "}
                {transfer.batch.batchNumber} ·{" "}
                {transfer.fromLocation.name} →{" "}
                {transfer.toLocation.name} ·{" "}
                {transfer.quantity} vials
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
