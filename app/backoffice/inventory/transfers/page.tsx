import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import InventoryTransferForm from "./InventoryTransferForm";

export default async function InventoryTransfersPage() {
  const [
    products,
    locations,
    recentTransfers,
    recentSimpleTransfers,
  ] = await Promise.all([
      prisma.backOfficeProduct.findMany({
        where: {
          active: true,
          inventoryType: {
            in: ["BATCHED", "SIMPLE"],
          },
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          sku: true,
          name: true,
          inventoryType: true,
          simpleBalances: {
            select: {
              locationId: true,
              quantity: true,
            },
          },
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

      prisma.backOfficeSimpleInventoryTransfer.findMany({
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
          product: {
            select: {
              sku: true,
              name: true,
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

  const combinedTransfers = [
    ...recentTransfers.map((transfer) => ({
      id: `batched-${transfer.id}`,
      inventoryType: "BATCHED" as const,
      productName: transfer.batch.product.name,
      sku: transfer.batch.product.sku,
      batchNumber: transfer.batch.batchNumber,
      fromLocationName: transfer.fromLocation.name,
      toLocationName: transfer.toLocation.name,
      quantity: transfer.quantity,
      createdAt: transfer.createdAt,
    })),
    ...recentSimpleTransfers.map((transfer) => ({
      id: `simple-${transfer.id}`,
      inventoryType: "SIMPLE" as const,
      productName: transfer.product.name,
      sku: transfer.product.sku,
      batchNumber: null,
      fromLocationName: transfer.fromLocation.name,
      toLocationName: transfer.toLocation.name,
      quantity: transfer.quantity,
      createdAt: transfer.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        b.createdAt.getTime() -
        a.createdAt.getTime()
    )
    .slice(0, 10);
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

        {combinedTransfers.length === 0 ? (
          <p className="backoffice-count-empty">
            No inventory transfers have been recorded yet.
          </p>
        ) : (
          <div>
            {combinedTransfers.map((transfer) => (
              <p key={transfer.id}>
                {transfer.productName} -{" "}
                {transfer.inventoryType === "BATCHED"
                  ? transfer.batchNumber
                  : "SIMPLE"}{" "}
                - {transfer.fromLocationName} -&gt;{" "}
                {transfer.toLocationName} -{" "}
                {transfer.quantity}{" "}
                {transfer.inventoryType === "BATCHED"
                  ? "vials"
                  : "units"}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
