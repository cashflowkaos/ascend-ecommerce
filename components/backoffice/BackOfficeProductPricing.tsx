"use client";

import { useState } from "react";

export default function BackOfficeProductPricing({
  defaultCost,
  defaultRetailPrice,
}: {
  defaultCost: string;
  defaultRetailPrice: string;
}) {
  const [cost, setCost] = useState(defaultCost);
  const [retailPrice, setRetailPrice] =
    useState(defaultRetailPrice);

  const numericCost =
    cost.trim() === "" ? null : Number(cost);

  const validCost =
    numericCost !== null &&
    Number.isFinite(numericCost) &&
    numericCost >= 0;

  const numericRetail =
    retailPrice.trim() === ""
      ? null
      : Number(retailPrice);

  const validRetail =
    numericRetail !== null &&
    Number.isFinite(numericRetail) &&
    numericRetail >= 0;

  const wholesale = validRetail
    ? numericRetail * 0.8
    : null;

  const tier1 = validCost
    ? Math.ceil(numericCost * 1.4)
    : null;

  const tier2 = validCost
    ? Math.ceil(numericCost * 1.35)
    : null;

  const tier3 = validCost
    ? Math.ceil(numericCost * 1.3)
    : null;

  return (
    <>
      <label className="backoffice-form-field">
        <span>Kit Cost</span>

        <input
          type="number"
          name="cost"
          min="0"
          step="0.01"
          value={cost}
          onChange={(event) =>
            setCost(event.target.value)
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
            setRetailPrice(event.target.value)
          }
          placeholder="0.00"
        />
      </label>

      <label className="backoffice-form-field">
        <span>Wholesale - 20% Off Retail</span>

        <input
          type="text"
          value={
            wholesale === null
              ? "-"
              : `$${wholesale.toFixed(2)}`
          }
          readOnly
          tabIndex={-1}
        />
      </label>

      <label className="backoffice-form-field">
        <span>Tier 1 - Cost + 40%</span>

        <input
          type="text"
          value={tier1 === null ? "-" : `$${tier1}`}
          readOnly
          tabIndex={-1}
        />
      </label>

      <label className="backoffice-form-field">
        <span>Tier 2 - Cost + 35%</span>

        <input
          type="text"
          value={tier2 === null ? "-" : `$${tier2}`}
          readOnly
          tabIndex={-1}
        />
      </label>

      <label className="backoffice-form-field">
        <span>Tier 3 - Cost + 30%</span>

        <input
          type="text"
          value={tier3 === null ? "-" : `$${tier3}`}
          readOnly
          tabIndex={-1}
        />
      </label>
    </>
  );
}
