import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function date(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function BackOfficePurchasingPage() {
  const purchaseOrders = await prisma.backOfficePurchaseOrder.findMany({
    orderBy: [
      { orderDate: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      supplier: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          quantityOrdered: true,
          quantityReceived: true,
          purchaseUnit: true,
          unitsPerKit: true,
          inventoryType: true,
        },
      },
    },
  });

  const openOrders = purchaseOrders.filter(
    (order) =>
      order.status !== "RECEIVED" &&
      order.status !== "CANCELLED"
  );

  const totalOrdered = purchaseOrders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const openValue = openOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const fullyReceived = purchaseOrders.filter(
    (order) => order.status === "RECEIVED"
  ).length;

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            PURCHASING
          </span>
          <h1>Purchase Orders</h1>
          <p>
            Track supplier orders, purchasing costs, and inventory
            receiving.
          </p>
        </div>

        <Link
          href="/backoffice/purchasing/new"
          className="backoffice-primary-button"
        >
          <Plus size={15} strokeWidth={2} />
          New Purchase Order
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">
            PURCHASE ORDERS
          </span>
          <strong>{purchaseOrders.length.toLocaleString()}</strong>
          <span>All recorded orders</span>
        </div>

        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">
            OPEN ORDERS
          </span>
          <strong>{openOrders.length.toLocaleString()}</strong>
          <span>Awaiting full receipt</span>
        </div>

        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">
            OPEN VALUE
          </span>
          <strong>{money(openValue)}</strong>
          <span>Value of open purchase orders</span>
        </div>

        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">
            RECEIVED
          </span>
          <strong>{fullyReceived.toLocaleString()}</strong>
          <span>Total ordered {money(totalOrdered)}</span>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PURCHASE HISTORY
            </span>
            <h2>Purchase Orders</h2>
          </div>
        </div>

        {purchaseOrders.length === 0 ? (
          <p>
            No purchase orders yet. Create the first PO when inventory
            is ordered from a supplier.
          </p>
        ) : (
          <>
            <div className="backoffice-table-wrap">
              <table className="backoffice-table">
                <thead>
                  <tr>
                    <th>PO</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Receiving</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((order) => {
                    const orderedPhysical = order.items.reduce(
                      (sum, item) => {
                        if (item.inventoryType === "NON_INVENTORY") {
                          return sum;
                        }

                        return (
                          sum +
                          item.quantityOrdered *
                            (item.purchaseUnit === "KIT"
                              ? item.unitsPerKit
                              : 1)
                        );
                      },
                      0
                    );

                    const receivedPhysical = order.items.reduce(
                      (sum, item) => {
                        if (item.inventoryType === "NON_INVENTORY") {
                          return sum;
                        }

                        return sum + item.quantityReceived;
                      },
                      0
                    );

                    return (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/backoffice/purchasing/${order.id}`}
                          >
                            <strong>{order.poNumber}</strong>
                          </Link>
                        </td>
                        <td>{date(order.orderDate)}</td>
                        <td>{order.supplier.name}</td>
                        <td>{statusLabel(order.status)}</td>
                        <td>
                          {receivedPhysical.toLocaleString()} /{" "}
                          {orderedPhysical.toLocaleString()} units
                        </td>
                        <td>{money(Number(order.total))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="backoffice-mobile-data-list">
              {purchaseOrders.map((order) => {
                const orderedPhysical = order.items.reduce(
                  (sum, item) => {
                    if (item.inventoryType === "NON_INVENTORY") {
                      return sum;
                    }

                    return (
                      sum +
                      item.quantityOrdered *
                        (item.purchaseUnit === "KIT"
                          ? item.unitsPerKit
                          : 1)
                    );
                  },
                  0
                );

                const receivedPhysical = order.items.reduce(
                  (sum, item) => {
                    if (item.inventoryType === "NON_INVENTORY") {
                      return sum;
                    }

                    return sum + item.quantityReceived;
                  },
                  0
                );

                return (
                  <Link
                    key={order.id}
                    href={`/backoffice/purchasing/${order.id}`}
                    className="backoffice-mobile-data-card"
                  >
                    <div>
                      <strong>{order.poNumber}</strong>
                      <span>{statusLabel(order.status)}</span>
                    </div>

                    <div>
                      <span>Supplier</span>
                      <strong>{order.supplier.name}</strong>
                    </div>

                    <div>
                      <span>Order Date</span>
                      <strong>{date(order.orderDate)}</strong>
                    </div>

                    <div>
                      <span>Receiving</span>
                      <strong>
                        {receivedPhysical.toLocaleString()} /{" "}
                        {orderedPhysical.toLocaleString()} units
                      </strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>{money(Number(order.total))}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
