"use client";

import { useMemo, useState } from "react";

type Location = {
  id: string;
  name: string;
  code: string;
};

type Batch = {
  id: string;
  batchNumber: string;
};

type ReceivingItem = {
  id: string;
  productName: string;
  productSku: string;
  inventoryType: string;
  purchaseUnit: string;
  unitCost: number;
  remaining: number;
  batches: Batch[];
};

type Props = {
  purchaseOrderId: string;
  locations: Location[];
  items: ReceivingItem[];
  action: (formData: FormData) => void | Promise<void>;
};

const NEW_BATCH = "__NEW_BATCH__";

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BackOfficeReceiveInventoryForm({
  purchaseOrderId,
  locations,
  items,
  action,
}: Props) {
  const [locationId, setLocationId] = useState("");

  const [quantities, setQuantities] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((item) => [item.id, "0"]))
  );

  const [batchSelections, setBatchSelections] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      items.map((item) => [item.id, ""])
    )
  );

  const [newBatchNumbers, setNewBatchNumbers] = useState<
    Record<string, string>
  >(() => Object.fromEntries(items.map((item) => [item.id, ""])));

  const canSubmit = useMemo(() => {
    if (!locationId) {
      return false;
    }

    const receivingItems = items.filter((item) => {
      const quantity = Number(quantities[item.id] ?? 0);
      return Number.isInteger(quantity) && quantity > 0;
    });

    if (receivingItems.length === 0) {
      return false;
    }

    return receivingItems.every((item) => {
      const quantity = Number(quantities[item.id] ?? 0);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > item.remaining
      ) {
        return false;
      }

      if (item.inventoryType !== "BATCHED") {
        return true;
      }

      const selection = batchSelections[item.id] ?? "";

      if (!selection) {
        return false;
      }

      if (selection === NEW_BATCH) {
        return Boolean(newBatchNumbers[item.id]?.trim());
      }

      return true;
    });
  }, [
    batchSelections,
    items,
    locationId,
    newBatchNumbers,
    quantities,
  ]);

  return (
    <form action={action}>
      <input
        type="hidden"
        name="purchaseOrderId"
        value={purchaseOrderId}
      />

      <div className="backoffice-form-grid">
        <label className="backoffice-form-field">
          <span>Receiving Location</span>
          <select
            name="locationId"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            required
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.code})
              </option>
            ))}
          </select>
        </label>

        <label className="backoffice-form-field">
          <span>Receipt Note</span>
          <input
            type="text"
            name="receiptNote"
            placeholder="Optional shipment / receiving note"
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 18,
        }}
      >
        {items.map((item) => {
          const quantity = quantities[item.id] ?? "0";
          const receivingThisItem = Number(quantity) > 0;
          const batchSelection = batchSelections[item.id] ?? "";
          const usingNewBatch = batchSelection === NEW_BATCH;

          const submittedBatchNumber =
            item.inventoryType !== "BATCHED"
              ? ""
              : usingNewBatch
                ? newBatchNumbers[item.id] ?? ""
                : batchSelection;

          return (
            <div
              key={item.id}
              className="backoffice-mobile-data-card"
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <input
                type="hidden"
                name="purchaseOrderItemId"
                value={item.id}
              />

              <input
                type="hidden"
                name="batchNumber"
                value={submittedBatchNumber}
              />

              <div style={{ display: "grid", gap: 5 }}>
                <strong>{item.productName}</strong>
                <span>
                  {item.productSku} Â· {statusLabel(item.inventoryType)}
                </span>
              </div>

              <div style={{ display: "grid", gap: 5 }}>
                <span>Remaining</span>
                <strong>
                  {item.remaining.toLocaleString()} physical unit(s)
                </strong>
              </div>

              <label className="backoffice-form-field">
                <span>Receive Now</span>
                <input
                  type="number"
                  name="receiveQuantity"
                  min="0"
                  max={item.remaining}
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              {item.inventoryType === "BATCHED" && (
                <>
                  <label className="backoffice-form-field">
                    <span>Batch / Lot Number</span>
                    <select
                      value={batchSelection}
                      onChange={(event) =>
                        setBatchSelections((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      required={receivingThisItem}
                    >
                      <option value="">Select batch / lot</option>

                      {item.batches.map((batch) => (
                        <option
                          key={batch.id}
                          value={batch.batchNumber}
                        >
                          {batch.batchNumber}
                        </option>
                      ))}

                      <option value={NEW_BATCH}>
                        + Add New Batch / Lot
                      </option>
                    </select>
                  </label>

                  {usingNewBatch && (
                    <label className="backoffice-form-field">
                      <span>New Batch / Lot Number</span>
                      <input
                        type="text"
                        value={newBatchNumbers[item.id] ?? ""}
                        onChange={(event) =>
                          setNewBatchNumbers((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Enter new batch / lot number"
                        required={receivingThisItem}
                      />
                    </label>
                  )}
                </>
              )}

              <div style={{ display: "grid", gap: 5 }}>
                <span>Purchase Cost</span>
                <strong>
                  {money(item.unitCost)} /{" "}
                  {item.purchaseUnit === "KIT" ? "kit" : "unit"}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 20,
        }}
      >
        <button
          type="submit"
          className="backoffice-primary-button"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          Receive Inventory
        </button>
      </div>
    </form>
  );
}
