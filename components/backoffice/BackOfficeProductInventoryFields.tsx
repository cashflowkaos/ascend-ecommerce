"use client";

import { useState } from "react";
import BackOfficeProductPricing from "./BackOfficeProductPricing";

type InventoryType =
  | "BATCHED"
  | "SIMPLE"
  | "NON_INVENTORY";

export default function BackOfficeProductInventoryFields() {
  const [inventoryType, setInventoryType] =
    useState<InventoryType>("BATCHED");

  return (
    <>
      <BackOfficeProductPricing
        defaultCost=""
        defaultRetailPrice=""
        defaultWholesalePrice=""
        defaultTier1Price=""
        defaultTier2Price=""
        defaultTier3Price=""
        inventoryType={inventoryType}
      />

      <label className="backoffice-form-field">
        <span>Inventory Type</span>

        <select
          name="inventoryType"
          value={inventoryType}
          onChange={(event) =>
            setInventoryType(
              event.target.value as InventoryType
            )
          }
          required
        >
          <option value="BATCHED">
            Batch Tracked
          </option>

          <option value="SIMPLE">
            Simple Stock
          </option>

          <option value="NON_INVENTORY">
            Non-Inventory
          </option>
        </select>

        <small>
          Batch Tracked uses lot/batch inventory. Simple Stock
          tracks quantity only. Non-Inventory does not track stock.
        </small>
      </label>

      {inventoryType === "BATCHED" ? (
        <label className="backoffice-form-field">
          <span>Units Per Kit</span>

          <input
            type="number"
            name="unitsPerKit"
            min="1"
            step="1"
            defaultValue="10"
            required
          />

          <small>
            Physical inventory is tracked in individual units.
            This controls kit conversion.
          </small>
        </label>
      ) : (
        <input
          type="hidden"
          name="unitsPerKit"
          value="1"
        />
      )}
    </>
  );
}