"use client";

import { useMemo, useState } from "react";
import { transferBackOfficeInventory } from "../actions";

type Location = {
  id: string;
  code: string;
  name: string;
};

type Balance = {
  locationId: string;
  quantity: number;
};

type Batch = {
  id: string;
  batchNumber: string;
  balances: Balance[];
};

type Product = {
  id: string;
  sku: string;
  name: string;
  batches: Batch[];
};

type InventoryTransferFormProps = {
  products: Product[];
  locations: Location[];
};

export default function InventoryTransferForm({
  products,
  locations,
}: InventoryTransferFormProps) {
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [fromLocationId, setFromLocationId] =
    useState("");
  const [toLocationId, setToLocationId] =
    useState("");

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) => product.id === productId
      ),
    [products, productId]
  );

  const selectedBatch = useMemo(
    () =>
      selectedProduct?.batches.find(
        (batch) => batch.id === batchId
      ),
    [selectedProduct, batchId]
  );

  const availableQuantity =
    selectedBatch?.balances.find(
      (balance) =>
        balance.locationId === fromLocationId
    )?.quantity ?? 0;

  const sourceLocations = locations.filter(
    (location) =>
      (selectedBatch?.balances.find(
        (balance) =>
          balance.locationId === location.id
      )?.quantity ?? 0) > 0
  );

  const destinationLocations = locations.filter(
    (location) =>
      location.id !== fromLocationId
  );

  return (
    <form
      action={transferBackOfficeInventory}
      className="backoffice-transfer-form"
    >
      <label>
        <span>Product</span>

        <select
          value={productId}
          onChange={(event) => {
            setProductId(event.target.value);
            setBatchId("");
            setFromLocationId("");
            setToLocationId("");
          }}
          required
        >
          <option value="">
            Select product
          </option>

          {products.map((product) => (
            <option
              key={product.id}
              value={product.id}
            >
              {product.name} · {product.sku}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Batch</span>

        <select
          name="batchId"
          value={batchId}
          onChange={(event) => {
            setBatchId(event.target.value);
            setFromLocationId("");
            setToLocationId("");
          }}
          disabled={!selectedProduct}
          required
        >
          <option value="">
            Select batch
          </option>

          {selectedProduct?.batches.map(
            (batch) => (
              <option
                key={batch.id}
                value={batch.id}
              >
                {batch.batchNumber}
              </option>
            )
          )}
        </select>
      </label>

      <label>
        <span>From Location</span>

        <select
          name="fromLocationId"
          value={fromLocationId}
          onChange={(event) => {
            setFromLocationId(event.target.value);

            if (
              event.target.value === toLocationId
            ) {
              setToLocationId("");
            }
          }}
          disabled={!selectedBatch}
          required
        >
          <option value="">
            Select source
          </option>

          {sourceLocations.map((location) => {
            const quantity =
              selectedBatch?.balances.find(
                (balance) =>
                  balance.locationId === location.id
              )?.quantity ?? 0;

            return (
              <option
                key={location.id}
                value={location.id}
              >
                {location.name} · {quantity} vials
              </option>
            );
          })}
        </select>
      </label>

      <label>
        <span>To Location</span>

        <select
          name="toLocationId"
          value={toLocationId}
          onChange={(event) =>
            setToLocationId(event.target.value)
          }
          disabled={!fromLocationId}
          required
        >
          <option value="">
            Select destination
          </option>

          {destinationLocations.map(
            (location) => (
              <option
                key={location.id}
                value={location.id}
              >
                {location.name}
              </option>
            )
          )}
        </select>
      </label>

      <label>
        <span>
          Quantity
          {fromLocationId
            ? ` · ${availableQuantity} available`
            : ""}
        </span>

        <input
          type="number"
          name="quantity"
          min="1"
          max={
            availableQuantity > 0
              ? availableQuantity
              : undefined
          }
          step="1"
          disabled={
            !fromLocationId ||
            !toLocationId ||
            availableQuantity <= 0
          }
          required
        />
      </label>

      <label className="backoffice-transfer-note">
        <span>Note</span>

        <input
          type="text"
          name="note"
          placeholder="Optional transfer note..."
        />
      </label>

      <button
        type="submit"
        className="backoffice-primary-button"
        disabled={
          !batchId ||
          !fromLocationId ||
          !toLocationId ||
          availableQuantity <= 0
        }
      >
        Complete Transfer
      </button>
    </form>
  );
}
