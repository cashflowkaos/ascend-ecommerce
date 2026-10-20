"use client";

import { useState } from "react";

type InventoryType =
  | "BATCHED"
  | "SIMPLE"
  | "NON_INVENTORY";

function parsePrice(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0
  ) {
    return null;
  }

  return numericValue;
}

function calculatedWholesale(retailPrice: string) {
  const retail = parsePrice(retailPrice);

  return retail === null
    ? ""
    : (retail * 0.8).toFixed(2);
}

function calculatedTier(
  cost: string,
  multiplier: number
) {
  const numericCost = parsePrice(cost);

  return numericCost === null
    ? ""
    : String(Math.ceil(numericCost * multiplier));
}

export default function BackOfficeProductPricing({
  defaultCost,
  defaultRetailPrice,
  defaultWholesalePrice,
  defaultTier1Price,
  defaultTier2Price,
  defaultTier3Price,
  inventoryType,
}: {
  defaultCost: string;
  defaultRetailPrice: string;
  defaultWholesalePrice: string;
  defaultTier1Price: string;
  defaultTier2Price: string;
  defaultTier3Price: string;
  inventoryType: InventoryType;
}) {
  const initialWholesale =
    defaultWholesalePrice ||
    calculatedWholesale(defaultRetailPrice);

  const initialTier1 =
    defaultTier1Price ||
    calculatedTier(defaultCost, 1.4);

  const initialTier2 =
    defaultTier2Price ||
    calculatedTier(defaultCost, 1.35);

  const initialTier3 =
    defaultTier3Price ||
    calculatedTier(defaultCost, 1.3);

  const [cost, setCost] = useState(defaultCost);
  const [retailPrice, setRetailPrice] =
    useState(defaultRetailPrice);

  const [wholesalePrice, setWholesalePrice] =
    useState(initialWholesale);

  const [tier1Price, setTier1Price] =
    useState(initialTier1);

  const [tier2Price, setTier2Price] =
    useState(initialTier2);

  const [tier3Price, setTier3Price] =
    useState(initialTier3);

  const [wholesaleManual, setWholesaleManual] =
    useState(defaultWholesalePrice !== "");

  const [tier1Manual, setTier1Manual] =
    useState(defaultTier1Price !== "");

  const [tier2Manual, setTier2Manual] =
    useState(defaultTier2Price !== "");

  const [tier3Manual, setTier3Manual] =
    useState(defaultTier3Price !== "");

  function handleRetailChange(value: string) {
    setRetailPrice(value);

    if (!wholesaleManual) {
      setWholesalePrice(
        calculatedWholesale(value)
      );
    }
  }

  function handleCostChange(value: string) {
    setCost(value);

    if (!tier1Manual) {
      setTier1Price(
        calculatedTier(value, 1.4)
      );
    }

    if (!tier2Manual) {
      setTier2Price(
        calculatedTier(value, 1.35)
      );
    }

    if (!tier3Manual) {
      setTier3Price(
        calculatedTier(value, 1.3)
      );
    }
  }

  return (
    <>
      <label className="backoffice-form-field">
        <span>
          {inventoryType === "BATCHED"
            ? "Kit Cost"
            : "Cost"}
        </span>

        <input
          type="number"
          name="cost"
          min="0"
          step="0.01"
          value={cost}
          onChange={(event) =>
            handleCostChange(event.target.value)
          }
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Retail Price</span>

        <input
          type="number"
          name="retailPrice"
          min="0"
          step="0.01"
          value={retailPrice}
          onChange={(event) =>
            handleRetailChange(event.target.value)
          }
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Wholesale - 20% Off Retail</span>

        <input
          type="number"
          name="wholesalePrice"
          min="0"
          step="0.01"
          value={wholesalePrice}
          onChange={(event) => {
            setWholesaleManual(true);
            setWholesalePrice(event.target.value);
          }}
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Tier 1 - Cost + 40%</span>

        <input
          type="number"
          name="tier1Price"
          min="0"
          step="0.01"
          value={tier1Price}
          onChange={(event) => {
            setTier1Manual(true);
            setTier1Price(event.target.value);
          }}
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Tier 2 - Cost + 35%</span>

        <input
          type="number"
          name="tier2Price"
          min="0"
          step="0.01"
          value={tier2Price}
          onChange={(event) => {
            setTier2Manual(true);
            setTier2Price(event.target.value);
          }}
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Tier 3 - Cost + 30%</span>

        <input
          type="number"
          name="tier3Price"
          min="0"
          step="0.01"
          value={tier3Price}
          onChange={(event) => {
            setTier3Manual(true);
            setTier3Price(event.target.value);
          }}
          placeholder="0.00"
        />
      </label>
    </>
  );
}
