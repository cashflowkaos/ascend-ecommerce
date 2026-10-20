"use client";

import { useMemo, useState } from "react";

export type PurchasingSupplier = {
  id: string;
  name: string;
};

export type PurchasingProduct = {
  id: string;
  sku: string;
  name: string;
  inventoryType: "BATCHED" | "SIMPLE" | "NON_INVENTORY";
  unitsPerKit: number;
  cost: number | null;
};

type PurchaseUnit = "UNIT" | "KIT";

type PurchaseLine = {
  key: string;
  productId: string;
  purchaseUnit: PurchaseUnit;
  quantity: number;
  unitCost: string;
};

type Props = {
  suppliers: PurchasingSupplier[];
  products: PurchasingProduct[];
};

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function makeLine(): PurchaseLine {
  return {
    key: crypto.randomUUID(),
    productId: "",
    purchaseUnit: "UNIT",
    quantity: 1,
    unitCost: "",
  };
}

export default function BackOfficePurchaseOrderForm({
  suppliers,
  products,
}: Props) {
  const [lines, setLines] = useState<PurchaseLine[]>([makeLine()]);
  const [shipping, setShipping] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const quantity =
          Number.isFinite(line.quantity) && line.quantity > 0
            ? line.quantity
            : 0;

        const unitCost = Number(line.unitCost);

        return (
          sum +
          quantity *
            (Number.isFinite(unitCost) && unitCost >= 0 ? unitCost : 0)
        );
      }, 0),
    [lines]
  );

  const shippingAmount = Number(shipping);
  const otherAmount = Number(otherCosts);

  const total =
    subtotal +
    (Number.isFinite(shippingAmount) && shippingAmount >= 0
      ? shippingAmount
      : 0) +
    (Number.isFinite(otherAmount) && otherAmount >= 0 ? otherAmount : 0);

  function updateLine(
    key: string,
    update: Partial<PurchaseLine>
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, ...update } : line
      )
    );
  }

  function selectProduct(key: string, productId: string) {
    const product = products.find((item) => item.id === productId);

    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) {
          return line;
        }

        if (!product) {
          return {
            ...line,
            productId,
            purchaseUnit: "UNIT",
            unitCost: "",
          };
        }

        return {
          ...line,
          productId,
          purchaseUnit: "UNIT",
          unitCost:
            product.cost === null ? "" : String(product.cost),
        };
      })
    );
  }

  function removeLine(key: string) {
    setLines((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((line) => line.key !== key);
    });
  }

  return (
    <div className="backoffice-form-grid">
      <label className="backoffice-form-field">
        <span>Supplier</span>
        <select name="supplierId" required defaultValue="">
          <option value="" disabled>
            Select supplier
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </label>

      <label className="backoffice-form-field">
        <span>PO Number</span>
        <input
          type="text"
          name="poNumber"
          placeholder="Leave blank to auto-generate"
          autoComplete="off"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Order Date</span>
        <input
          type="date"
          name="orderDate"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </label>

      <label className="backoffice-form-field">
        <span>Expected Date</span>
        <input type="date" name="expectedDate" />
      </label>

      <label className="backoffice-form-field">
        <span>Status</span>
        <select name="status" defaultValue="ORDERED">
          <option value="DRAFT">Draft</option>
          <option value="ORDERED">Ordered</option>
          <option value="SHIPPED">Shipped</option>
        </select>
      </label>

      <label className="backoffice-form-field">
        <span>Supplier Reference</span>
        <input
          type="text"
          name="supplierReference"
          autoComplete="off"
        />
      </label>

      <label className="backoffice-form-field backoffice-form-field-wide">
        <span>Tracking Number</span>
        <input
          type="text"
          name="trackingNumber"
          autoComplete="off"
        />
      </label>

      <div className="backoffice-form-field backoffice-form-field-wide">
        <span>Products</span>

        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {lines.map((line, index) => {
            const product = products.find(
              (item) => item.id === line.productId
            );

            const physicalUnits =
              line.purchaseUnit === "KIT" && product
                ? line.quantity * product.unitsPerKit
                : line.quantity;

            const lineTotal =
              line.quantity *
              (Number.isFinite(Number(line.unitCost))
                ? Number(line.unitCost)
                : 0);

            return (
              <div
                key={line.key}
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                <input
                  type="hidden"
                  name="lineKey"
                  value={line.key}
                />

                <label className="backoffice-form-field">
                  <span>Product {index + 1}</span>
                  <select
                    name="productId"
                    required
                    value={line.productId}
                    onChange={(event) =>
                      selectProduct(line.key, event.target.value)
                    }
                  >
                    <option value="" disabled>
                      Select product
                    </option>
                    {products.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} - {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 10,
                  }}
                >
                  <label className="backoffice-form-field">
                    <span>Purchase Unit</span>
                    <select
                      name="purchaseUnit"
                      value={line.purchaseUnit}
                      onChange={(event) =>
                        updateLine(line.key, {
                          purchaseUnit:
                            event.target.value as PurchaseUnit,
                        })
                      }
                    >
                      <option value="UNIT">Unit</option>
                      {product?.inventoryType === "BATCHED" && (
                        <option value="KIT">
                          Kit ({product.unitsPerKit} units)
                        </option>
                      )}
                    </select>
                  </label>

                  <label className="backoffice-form-field">
                    <span>Quantity</span>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      step="1"
                      required
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(line.key, {
                          quantity: Math.max(
                            1,
                            Math.trunc(Number(event.target.value) || 1)
                          ),
                        })
                      }
                    />
                  </label>

                  <label className="backoffice-form-field">
                    <span>
                      Cost per{" "}
                      {line.purchaseUnit === "KIT" ? "Kit" : "Unit"}
                    </span>
                    <input
                      type="number"
                      name="unitCost"
                      min="0"
                      step="0.0001"
                      required
                      value={line.unitCost}
                      onChange={(event) =>
                        updateLine(line.key, {
                          unitCost: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                {product && (
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {product.inventoryType === "BATCHED"
                      ? `${physicalUnits.toLocaleString()} physical unit${
                          physicalUnits === 1 ? "" : "s"
                        }`
                      : product.inventoryType === "SIMPLE"
                        ? `${physicalUnits.toLocaleString()} inventory unit${
                            physicalUnits === 1 ? "" : "s"
                          }`
                        : "Non-inventory item"}
                    {" · "}
                    Line total {money(lineTotal)}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    className="backoffice-secondary-button"
                    disabled={lines.length === 1}
                    onClick={() => removeLine(line.key)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <div>
            <button
              type="button"
              className="backoffice-secondary-button"
              onClick={() =>
                setLines((current) => [...current, makeLine()])
              }
            >
              Add Product
            </button>
          </div>
        </div>
      </div>

      <label className="backoffice-form-field">
        <span>Shipping / Freight</span>
        <input
          type="number"
          name="shipping"
          min="0"
          step="0.01"
          value={shipping}
          onChange={(event) => setShipping(event.target.value)}
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Other Costs</span>
        <input
          type="number"
          name="otherCosts"
          min="0"
          step="0.01"
          value={otherCosts}
          onChange={(event) => setOtherCosts(event.target.value)}
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field backoffice-form-field-wide">
        <span>Notes</span>
        <textarea name="notes" rows={4} />
      </label>

      <div
        className="backoffice-form-field backoffice-form-field-wide"
        style={{
          display: "grid",
          gap: 6,
          paddingTop: 8,
        }}
      >
        <strong>Purchase Order Total</strong>
        <span>Products: {money(subtotal)}</span>
        <span>
          Shipping:{" "}
          {money(
            Number.isFinite(shippingAmount) && shippingAmount >= 0
              ? shippingAmount
              : 0
          )}
        </span>
        <span>
          Other:{" "}
          {money(
            Number.isFinite(otherAmount) && otherAmount >= 0
              ? otherAmount
              : 0
          )}
        </span>
        <strong>Total: {money(total)}</strong>
      </div>
    </div>
  );
}
