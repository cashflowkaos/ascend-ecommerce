import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function date(value: Date | null) {
  if (!value) {
    return "-";
  }

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

export default async function BackOfficePurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.backOfficePurchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const orderedPhysical = order.items.reduce((sum, item) => {
    if (item.inventoryType === "NON_INVENTORY") {
      return sum;
    }

    return (
      sum +
      item.quantityOrdered *
        (item.purchaseUnit === "KIT" ? item.unitsPerKit : 1)
    );
  }, 0);

  const receivedPhysical = order.items.reduce((sum, item) => {
    if (item.inventoryType === "NON_INVENTORY") {
      return sum;
    }

    return sum + item.quantityReceived;
  }, 0);

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            PURCHASING / {order.poNumber}
          </span>
          <h1>{order.poNumber}</h1>
          <p>
            {order.supplier.name} · {statusLabel(order.status)}
          </p>
        </div>

        <Link
          href="/backoffice/purchasing"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Purchasing
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">STATUS</span>
          <strong>{statusLabel(order.status)}</strong>
          <span>Order placed {date(order.orderDate)}</span>
        </div>

        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">TOTAL</span>
          <strong>{money(Number(order.total))}</strong>
          <span>{order.items.length} product line(s)</span>
        </div>

        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">ORDERED</span>
          <strong>{orderedPhysical.toLocaleString()}</strong>
          <span>Physical inventory units</span>
        </div>

        <div className="backoffice-stat-card">
          <span className="backoffice-eyebrow">RECEIVED</span>
          <strong>
            {receivedPhysical.toLocaleString()} /{" "}
            {orderedPhysical.toLocaleString()}
          </strong>
          <span>Physical inventory units</span>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">ORDER DETAILS</span>
            <h2>Supplier & Order Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <div className="backoffice-form-field">
            <span>Supplier</span>
            <strong>{order.supplier.name}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Order Date</span>
            <strong>{date(order.orderDate)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Expected Date</span>
            <strong>{date(order.expectedDate)}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Supplier Reference</span>
            <strong>{order.supplierReference || "-"}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Tracking Number</span>
            <strong>{order.trackingNumber || "-"}</strong>
          </div>

          <div className="backoffice-form-field">
            <span>Shipped Date</span>
            <strong>{date(order.shippedDate)}</strong>
          </div>

          {order.notes && (
            <div className="backoffice-form-field backoffice-form-field-wide">
              <span>Notes</span>
              <strong style={{ whiteSpace: "pre-wrap" }}>
                {order.notes}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">PRODUCTS</span>
            <h2>Purchase Order Items</h2>
          </div>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Ordered</th>
                <th>Physical Units</th>
                <th>Received</th>
                <th>Cost</th>
                <th>Line Total</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => {
                const physicalUnits =
                  item.inventoryType === "NON_INVENTORY"
                    ? 0
                    : item.quantityOrdered *
                      (item.purchaseUnit === "KIT"
                        ? item.unitsPerKit
                        : 1);

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.productName}</strong>
                      <br />
                      <span>{item.productSku}</span>
                    </td>
                    <td>{statusLabel(item.inventoryType)}</td>
                    <td>
                      {item.quantityOrdered.toLocaleString()}{" "}
                      {item.purchaseUnit === "KIT" ? "kit(s)" : "unit(s)"}
                    </td>
                    <td>
                      {item.inventoryType === "NON_INVENTORY"
                        ? "-"
                        : physicalUnits.toLocaleString()}
                    </td>
                    <td>
                      {item.inventoryType === "NON_INVENTORY"
                        ? "-"
                        : item.quantityReceived.toLocaleString()}
                    </td>
                    <td>
                      {money(Number(item.unitCost))} /{" "}
                      {item.purchaseUnit === "KIT" ? "kit" : "unit"}
                    </td>
                    <td>{money(Number(item.lineTotal))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="backoffice-mobile-data-list">
          {order.items.map((item) => {
            const physicalUnits =
              item.inventoryType === "NON_INVENTORY"
                ? 0
                : item.quantityOrdered *
                  (item.purchaseUnit === "KIT"
                    ? item.unitsPerKit
                    : 1);

            return (
              <div
                key={item.id}
                className="backoffice-mobile-data-card"
              >
                <div>
                  <strong>{item.productName}</strong>
                  <span>{item.productSku}</span>
                </div>

                <div>
                  <span>Ordered</span>
                  <strong>
                    {item.quantityOrdered.toLocaleString()}{" "}
                    {item.purchaseUnit === "KIT" ? "kit(s)" : "unit(s)"}
                  </strong>
                </div>

                <div>
                  <span>Physical Units</span>
                  <strong>
                    {item.inventoryType === "NON_INVENTORY"
                      ? "-"
                      : physicalUnits.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Received</span>
                  <strong>
                    {item.inventoryType === "NON_INVENTORY"
                      ? "-"
                      : item.quantityReceived.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Cost</span>
                  <strong>{money(Number(item.unitCost))}</strong>
                </div>

                <div>
                  <span>Line Total</span>
                  <strong>{money(Number(item.lineTotal))}</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gap: 6,
            justifyContent: "end",
            textAlign: "right",
            marginTop: 20,
          }}
        >
          <span>Products: {money(Number(order.subtotal))}</span>
          <span>Shipping: {money(Number(order.shipping))}</span>
          <span>Other Costs: {money(Number(order.otherCosts))}</span>
          <strong>Total: {money(Number(order.total))}</strong>
        </div>
      </div>
    </>
  );
}
