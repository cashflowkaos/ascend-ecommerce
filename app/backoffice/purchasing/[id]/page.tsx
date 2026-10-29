import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackOfficeReceiveInventoryForm from "@/components/backoffice/BackOfficeReceiveInventoryForm";
import {
  receiveBackOfficePurchaseOrder,
  voidBackOfficePurchaseReceipt,
  recordBackOfficePurchasePayment,
  voidBackOfficePurchasePayment,
  deleteBackOfficePurchaseOrder,
} from "../actions";

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

function dateTime(value: Date | null) {
  if (!value) {
    return "-";
  }

  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function orderedPhysicalUnits(item: {
  inventoryType: string;
  purchaseUnit: string;
  quantityOrdered: number;
  unitsPerKit: number;
}) {
  if (item.inventoryType === "NON_INVENTORY") {
    return 0;
  }

  return (
    item.quantityOrdered *
    (item.purchaseUnit === "KIT" ? item.unitsPerKit : 1)
  );
}

export default async function BackOfficePurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, locations] = await Promise.all([
    prisma.backOfficePurchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              include: {
                batches: {
                  where: {
                    status: "ACTIVE",
                  },
                  orderBy: {
                    receivedAt: "asc",
                  },
                  select: {
                    id: true,
                    batchNumber: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
        receipts: {
          orderBy: {
            receivedAt: "desc",
          },
          include: {
            location: true,
            items: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
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
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
  ]);

  if (!order) {
    notFound();
  }

  const orderedPhysical = order.items.reduce(
    (sum, item) => sum + orderedPhysicalUnits(item),
    0
  );

  const receivedPhysical = order.items.reduce((sum, item) => {
    if (item.inventoryType === "NON_INVENTORY") {
      return sum;
    }

    return sum + item.quantityReceived;
  }, 0);

  const inventoryItems = order.items.filter(
    (item) => item.inventoryType !== "NON_INVENTORY"
  );

  const remainingItems = inventoryItems.filter((item) => {
    const ordered = orderedPhysicalUnits(item);
    return item.quantityReceived < ordered;
  });

  const canReceive =
    remainingItems.length > 0 &&
    order.status !== "CANCELLED" &&
    order.status !== "RECEIVED";

  const activePayments = order.payments.filter(
    (payment) => !payment.voidedAt
  );

  const amountPaid = activePayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const paymentBalance = Math.max(
    0,
    Number(order.total) - amountPaid
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            PURCHASING / {order.poNumber}
          </span>
          <h1>{order.poNumber}</h1>
          <p>
            {order.supplier.name} - {statusLabel(order.status)}
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

          <div className="backoffice-form-field">
            <span>Received Date</span>
            <strong>{date(order.receivedDate)}</strong>
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
                <th>Remaining</th>
                <th>Cost</th>
                <th>Line Total</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => {
                const physicalUnits = orderedPhysicalUnits(item);
                const remaining =
                  item.inventoryType === "NON_INVENTORY"
                    ? 0
                    : Math.max(
                        0,
                        physicalUnits - item.quantityReceived
                      );

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
                      {item.purchaseUnit === "KIT"
                        ? "kit(s)"
                        : "unit(s)"}
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
                      {item.inventoryType === "NON_INVENTORY"
                        ? "-"
                        : remaining.toLocaleString()}
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
            const physicalUnits = orderedPhysicalUnits(item);
            const remaining =
              item.inventoryType === "NON_INVENTORY"
                ? 0
                : Math.max(
                    0,
                    physicalUnits - item.quantityReceived
                  );

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
                  <span>Type</span>
                  <strong>{statusLabel(item.inventoryType)}</strong>
                </div>

                <div>
                  <span>Ordered</span>
                  <strong>
                    {item.quantityOrdered.toLocaleString()}{" "}
                    {item.purchaseUnit === "KIT"
                      ? "kit(s)"
                      : "unit(s)"}
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
                  <span>Remaining</span>
                  <strong>
                    {item.inventoryType === "NON_INVENTORY"
                      ? "-"
                      : remaining.toLocaleString()}
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

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div style={{ display: "grid", gap: 5 }}>
            <span className="backoffice-eyebrow">PAYMENTS</span>
            <h2>Purchase Payments</h2>
            <p>
              Record actual money paid toward this purchase order.
              Payments affect purchasing cash activity but do not change inventory.
            </p>
          </div>
        </div>

        <div className="backoffice-stat-grid">
          <div className="backoffice-stat-card">
            <span className="backoffice-eyebrow">PO TOTAL</span>
            <strong>{money(Number(order.total))}</strong>
          </div>

          <div className="backoffice-stat-card">
            <span className="backoffice-eyebrow">PAID</span>
            <strong>{money(amountPaid)}</strong>
          </div>

          <div className="backoffice-stat-card">
            <span className="backoffice-eyebrow">BALANCE</span>
            <strong>{money(paymentBalance)}</strong>
          </div>
        </div>

        {paymentBalance > 0 && order.status !== "CANCELLED" && (
          <form
            action={recordBackOfficePurchasePayment}
            style={{
              display: "grid",
              gap: 16,
              marginTop: 20,
            }}
          >
            <input
              type="hidden"
              name="purchaseOrderId"
              value={order.id}
            />

            <div className="backoffice-form-grid">
              <label className="backoffice-form-field">
                <span>Amount</span>
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  max={paymentBalance.toFixed(2)}
                  step="0.01"
                  defaultValue={paymentBalance.toFixed(2)}
                  required
                />
              </label>

              <label className="backoffice-form-field">
                <span>Payment Date</span>
                <input
                  type="date"
                  name="paidAt"
                  defaultValue={today}
                  required
                />
              </label>

              <label className="backoffice-form-field">
                <span>Paid From</span>
                <select name="paidFrom" required defaultValue="">
                  <option value="">Select account</option>
                  <option value="BANK">Bank</option>
                  <option value="CASH">Cash</option>
                  <option value="ZELLE">Zelle</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>

              <label className="backoffice-form-field">
                <span>Reference</span>
                <input
                  type="text"
                  name="reference"
                  placeholder="Optional transaction / confirmation"
                />
              </label>

              <label className="backoffice-form-field backoffice-form-field-wide">
                <span>Payment Note</span>
                <input
                  type="text"
                  name="paymentNote"
                  placeholder="Optional payment note"
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                className="backoffice-primary-button"
              >
                Record Payment
              </button>
            </div>
          </form>
        )}

        {order.payments.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: 14,
              marginTop: 22,
            }}
          >
            <span className="backoffice-eyebrow">PAYMENT HISTORY</span>

            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="backoffice-mobile-data-card"
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 5 }}>
                  <strong>{money(Number(payment.amount))}</strong>
                  <span>{date(payment.paidAt)} ? {payment.paidFrom}</span>
                </div>

                {payment.reference && (
                  <div style={{ display: "grid", gap: 5 }}>
                    <span>Reference</span>
                    <strong>{payment.reference}</strong>
                  </div>
                )}

                {payment.note && (
                  <div style={{ display: "grid", gap: 5 }}>
                    <span>Note</span>
                    <strong>{payment.note}</strong>
                  </div>
                )}

                {payment.createdByName && (
                  <div style={{ display: "grid", gap: 5 }}>
                    <span>Recorded By</span>
                    <strong>{payment.createdByName}</strong>
                  </div>
                )}

                {payment.voidedAt ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 5,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: 10,
                    }}
                  >
                    <span>VOIDED {dateTime(payment.voidedAt)}</span>
                    <strong>{payment.voidReason || "Payment voided"}</strong>
                    {payment.voidedByName && (
                      <span>By {payment.voidedByName}</span>
                    )}
                  </div>
                ) : (
                  <form
                    action={voidBackOfficePurchasePayment}
                    style={{
                      display: "grid",
                      gap: 10,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: 12,
                    }}
                  >
                    <input
                      type="hidden"
                      name="paymentId"
                      value={payment.id}
                    />

                    <label className="backoffice-form-field">
                      <span>Void Reason</span>
                      <input
                        type="text"
                        name="voidReason"
                        placeholder="Required ? e.g. payment entered incorrectly"
                        required
                      />
                    </label>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="submit"
                        className="backoffice-secondary-button"
                      >
                        Void Payment
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canReceive && (
        <div className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div style={{ display: "grid", gap: 5 }}>
              <span className="backoffice-eyebrow">RECEIVING</span>
              <h2>Receive Inventory</h2>
              <p>
                Enter the physical quantity that arrived in this shipment.
                Inventory updates only after this receipt is submitted.
              </p>
            </div>
          </div>

          {locations.length === 0 ? (
            <p>
              An active inventory location is required before receiving.
            </p>
          ) : (
            <BackOfficeReceiveInventoryForm
              purchaseOrderId={order.id}
              locations={locations}
              items={remainingItems.map((item) => {
                const ordered = orderedPhysicalUnits(item);
                const remaining = Math.max(
                  0,
                  ordered - item.quantityReceived
                );

                return {
                  id: item.id,
                  productName: item.productName,
                  productSku: item.productSku,
                  inventoryType: item.inventoryType,
                  purchaseUnit: item.purchaseUnit,
                  unitCost: Number(item.unitCost),
                  remaining,
                  batches: item.product.batches,
                };
              })}
              action={receiveBackOfficePurchaseOrder}
            />
          )}
        </div>
      )}

      {order.receipts.length > 0 && (
        <div className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div style={{ display: "grid", gap: 5 }}>
              <span className="backoffice-eyebrow">
                RECEIPT HISTORY
              </span>
              <h2>Received Shipments</h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {order.receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="backoffice-mobile-data-card"
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 5 }}>
                  <strong>{dateTime(receipt.receivedAt)}</strong>
                  <span>
                    {receipt.location.name} ({receipt.location.code})
                  </span>
                </div>

                {receipt.receivedByName && (
                  <div style={{ display: "grid", gap: 5 }}>
                    <span>Received By</span>
                    <strong>{receipt.receivedByName}</strong>
                  </div>
                )}

                {receipt.note && (
                  <div style={{ display: "grid", gap: 5 }}>
                    <span>Note</span>
                    <strong>{receipt.note}</strong>
                  </div>
                )}

                {receipt.items.map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.product.name} ({item.product.sku})
                    </span>
                    <strong>
                      {item.quantityReceived.toLocaleString()} unit(s)
                      {item.batchNumber
                        ? ` - Batch ${item.batchNumber}`
                        : ""}
                    </strong>
                  </div>
                ))}

                {receipt.voidedAt ? (
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: 10,
                    }}
                  >
                    <span>VOIDED {dateTime(receipt.voidedAt)}</span>
                    <strong>
                      {receipt.voidReason || "Receipt voided"}
                    </strong>
                    {receipt.voidedByName && (
                      <span>By {receipt.voidedByName}</span>
                    )}
                  </div>
                ) : (
                  <form
                    action={voidBackOfficePurchaseReceipt}
                    style={{
                      display: "grid",
                      gap: 10,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: 12,
                    }}
                  >
                    <input
                      type="hidden"
                      name="receiptId"
                      value={receipt.id}
                    />

                    <label className="backoffice-form-field">
                      <span>Void Reason</span>
                      <input
                        type="text"
                        name="voidReason"
                        placeholder="Required - e.g. accidental duplicate receipt"
                        required
                      />
                    </label>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="submit"
                        className="backoffice-secondary-button"
                      >
                        Void Receipt
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {order.receipts.length === 0 && order.payments.length === 0 && (
        <div
          className="backoffice-panel"
          style={{
            marginTop: 18,
            borderColor: "rgba(239,68,68,0.35)",
          }}
        >
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                DANGER ZONE
              </span>
              <h2>Delete Purchase Order</h2>
              <p>
                Permanently delete this unused purchase order. This cannot be undone.
              </p>
            </div>

            <form action={deleteBackOfficePurchaseOrder}>
              <input
                type="hidden"
                name="purchaseOrderId"
                value={order.id}
              />
              <button
                type="submit"
                className="backoffice-secondary-button"
              >
                Delete Purchase Order
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

