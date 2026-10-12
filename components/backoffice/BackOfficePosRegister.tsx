"use client";

import { useMemo, useState } from "react";

type PricingType =
  | "RETAIL"
  | "WHOLESALE"
  | "TIER_1"
  | "TIER_2"
  | "TIER_3";

type SellUnit = "UNIT" | "KIT";

export type PosCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  pricingType: PricingType;
};

export type PosLocation = {
  id: string;
  code: string;
  name: string;
};

export type PosProduct = {
  id: string;
  sku: string;
  name: string;
  cost: number | null;
  retailPrice: number | null;
  unitsPerKit: number;
  quantities: Record<string, number>;
};

type CartLine = {
  key: string;
  productId: string;
  sellUnit: SellUnit;
  quantity: number;
};

type Props = {
  customers: PosCustomer[];
  locations: PosLocation[];
  products: PosProduct[];
};

function getWholesalePrice(retailPrice: number | null) {
  if (retailPrice === null) {
    return null;
  }

  return retailPrice * 0.8;
}

function getTierKitPrice(
  cost: number | null,
  pricingType: PricingType
) {
  if (cost === null) {
    return null;
  }

  if (pricingType === "TIER_1") {
    return Math.ceil(cost * 1.4);
  }

  if (pricingType === "TIER_2") {
    return Math.ceil(cost * 1.35);
  }

  if (pricingType === "TIER_3") {
    return Math.ceil(cost * 1.3);
  }

  return null;
}

function getStandardPrice(
  product: PosProduct,
  pricingType: PricingType,
  sellUnit: SellUnit
) {
  const retailPrice = product.retailPrice;
  const wholesalePrice = getWholesalePrice(retailPrice);

  if (sellUnit === "UNIT") {
    if (pricingType === "RETAIL") {
      return retailPrice;
    }

    return wholesalePrice;
  }

  if (
    pricingType === "TIER_1" ||
    pricingType === "TIER_2" ||
    pricingType === "TIER_3"
  ) {
    return getTierKitPrice(product.cost, pricingType);
  }

  const perUnitPrice =
    pricingType === "RETAIL"
      ? retailPrice
      : wholesalePrice;

  if (perUnitPrice === null) {
    return null;
  }

  return perUnitPrice * product.unitsPerKit;
}

function formatMoney(value: number | null) {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getCartKey(productId: string, sellUnit: SellUnit) {
  return `${productId}:${sellUnit}`;
}

export function BackOfficePosRegister({
  customers,
  locations,
  products,
}: Props) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartError, setCartError] = useState<string | null>(null);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === selectedCustomerId
      ) ?? null,
    [customers, selectedCustomerId]
  );

  const selectedLocation = useMemo(
    () =>
      locations.find(
        (location) => location.id === selectedLocationId
      ) ?? null,
    [locations, selectedLocationId]
  );

  const pricingType =
    selectedCustomer?.pricingType ?? "RETAIL";

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customers.slice(0, 12);
    }

    return customers
      .filter((customer) => {
        const searchable = [
          customer.firstName,
          customer.lastName,
          customer.company,
          customer.email,
          customer.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 12);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return products.slice(0, 20);
    }

    return products
      .filter((product) =>
        `${product.name} ${product.sku}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 20);
  }, [products, productSearch]);

  function getBaseUnits(
    product: PosProduct,
    sellUnit: SellUnit,
    quantity: number
  ) {
    return (
      quantity *
      (sellUnit === "KIT" ? product.unitsPerKit : 1)
    );
  }

  function getProductCartUnits(
    productId: string,
    nextCart = cart
  ) {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return 0;
    }

    return nextCart
      .filter((line) => line.productId === productId)
      .reduce(
        (total, line) =>
          total +
          getBaseUnits(
            product,
            line.sellUnit,
            line.quantity
          ),
        0
      );
  }

  function canUseCart(
    product: PosProduct,
    nextCart: CartLine[]
  ) {
    if (!selectedLocationId) {
      setCartError("Select an inventory location first.");
      return false;
    }

    const available =
      product.quantities[selectedLocationId] ?? 0;

    const requested = getProductCartUnits(
      product.id,
      nextCart
    );

    if (requested > available) {
      setCartError(
        `${product.name} only has ${available} physical units available at ${selectedLocation?.name ?? "this location"}.`
      );
      return false;
    }

    return true;
  }

  function addToCart(
    product: PosProduct,
    sellUnit: SellUnit
  ) {
    setCartError(null);

    if (!selectedLocationId) {
      setCartError("Select an inventory location first.");
      return;
    }

    const price = getStandardPrice(
      product,
      pricingType,
      sellUnit
    );

    if (price === null) {
      setCartError(
        `${product.name} does not have enough pricing information for this sale.`
      );
      return;
    }

    const key = getCartKey(product.id, sellUnit);
    const existing = cart.find((line) => line.key === key);

    const nextCart = existing
      ? cart.map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + 1 }
            : line
        )
      : [
          ...cart,
          {
            key,
            productId: product.id,
            sellUnit,
            quantity: 1,
          },
        ];

    if (!canUseCart(product, nextCart)) {
      return;
    }

    setCart(nextCart);
  }

  function changeQuantity(key: string, delta: number) {
    setCartError(null);

    const line = cart.find((item) => item.key === key);

    if (!line) {
      return;
    }

    const product = products.find(
      (item) => item.id === line.productId
    );

    if (!product) {
      return;
    }

    const nextQuantity = line.quantity + delta;

    if (nextQuantity <= 0) {
      setCart(
        cart.filter((item) => item.key !== key)
      );
      return;
    }

    const nextCart = cart.map((item) =>
      item.key === key
        ? { ...item, quantity: nextQuantity }
        : item
    );

    if (!canUseCart(product, nextCart)) {
      return;
    }

    setCart(nextCart);
  }

  function removeLine(key: string) {
    setCartError(null);
    setCart(cart.filter((line) => line.key !== key));
  }

  function handleLocationChange(locationId: string) {
    setSelectedLocationId(locationId);
    setCart([]);
    setCartError(null);
  }

  const cartDetails = useMemo(
    () =>
      cart.flatMap((line) => {
        const product = products.find(
          (item) => item.id === line.productId
        );

        if (!product) {
          return [];
        }

        const standardPrice = getStandardPrice(
          product,
          pricingType,
          line.sellUnit
        );

        if (standardPrice === null) {
          return [];
        }

        const baseUnits = getBaseUnits(
          product,
          line.sellUnit,
          line.quantity
        );

        return [
          {
            ...line,
            product,
            standardPrice,
            baseUnits,
            lineTotal: standardPrice * line.quantity,
          },
        ];
      }),
    [cart, products, pricingType]
  );

  const subtotal = useMemo(
    () =>
      cartDetails.reduce(
        (total, line) => total + line.lineTotal,
        0
      ),
    [cartDetails]
  );

  return (
    <div className="backoffice-pos-register">
      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              TRANSACTION SETUP
            </span>
            <h2>Customer & Location</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>Inventory Location</span>
            <select
              value={selectedLocationId}
              onChange={(event) =>
                handleLocationChange(event.target.value)
              }
            >
              <option value="">Select location...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name}
                </option>
              ))}
            </select>
            <small>
              Changing location clears the current cart.
            </small>
          </label>

          <label className="backoffice-form-field">
            <span>Customer Search</span>
            <input
              type="search"
              value={customerSearch}
              onChange={(event) =>
                setCustomerSearch(event.target.value)
              }
              placeholder="Name, company, email, or phone"
            />
          </label>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Pricing</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                    {customer.company ? (
                      <div>{customer.company}</div>
                    ) : null}
                  </td>
                  <td>
                    <div>{customer.phone || "-"}</div>
                    <div>{customer.email || "-"}</div>
                  </td>
                  <td>
                    {customer.pricingType.replaceAll("_", " ")}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="backoffice-secondary-button"
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setCartError(null);
                      }}
                    >
                      {selectedCustomerId === customer.id
                        ? "Selected"
                        : "Select"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              PRODUCT SEARCH
            </span>
            <h2>Add Products</h2>
            <p>
              Pricing: {pricingType.replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Search Inventory</span>
            <input
              type="search"
              value={productSearch}
              onChange={(event) =>
                setProductSearch(event.target.value)
              }
              placeholder="Product name or SKU"
            />
          </label>
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Available</th>
                <th>Unit</th>
                <th>Kit</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const available = selectedLocationId
                  ? product.quantities[selectedLocationId] ?? 0
                  : null;

                const unitPrice = getStandardPrice(
                  product,
                  pricingType,
                  "UNIT"
                );

                const kitPrice = getStandardPrice(
                  product,
                  pricingType,
                  "KIT"
                );

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <div>{product.sku}</div>
                    </td>

                    <td>
                      {available === null
                        ? "Select location"
                        : available}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="backoffice-secondary-button"
                        disabled={
                          !selectedLocationId ||
                          unitPrice === null ||
                          available === 0
                        }
                        onClick={() =>
                          addToCart(product, "UNIT")
                        }
                      >
                        Add Unit {formatMoney(unitPrice)}
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="backoffice-secondary-button"
                        disabled={
                          !selectedLocationId ||
                          kitPrice === null ||
                          available === null ||
                          available < product.unitsPerKit
                        }
                        onClick={() =>
                          addToCart(product, "KIT")
                        }
                      >
                        Add Kit {formatMoney(kitPrice)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">
              CURRENT SALE
            </span>
            <h2>Cart</h2>
            <p>
              {selectedCustomer
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                : "No customer selected"}
              {" - "}
              {selectedLocation
                ? selectedLocation.name
                : "No location selected"}
            </p>
          </div>

          {cart.length > 0 ? (
            <button
              type="button"
              className="backoffice-secondary-button"
              onClick={() => {
                setCart([]);
                setCartError(null);
              }}
            >
              Clear Cart
            </button>
          ) : null}
        </div>

        {cartError ? (
          <p className="backoffice-pos-error">
            {cartError}
          </p>
        ) : null}

        {cartDetails.length === 0 ? (
          <p>No products have been added yet.</p>
        ) : (
          <div className="backoffice-table-wrap">
            <table className="backoffice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sell Unit</th>
                  <th>Qty</th>
                  <th>Physical Units</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {cartDetails.map((line) => (
                  <tr key={line.key}>
                    <td>
                      <strong>{line.product.name}</strong>
                      <div>{line.product.sku}</div>
                    </td>

                    <td>
                      {line.sellUnit === "KIT"
                        ? `Kit (${line.product.unitsPerKit})`
                        : "Unit"}
                    </td>

                    <td>
                      <div className="backoffice-pos-quantity">
                        <button
                          type="button"
                          className="backoffice-secondary-button"
                          onClick={() =>
                            changeQuantity(line.key, -1)
                          }
                        >
                          -
                        </button>

                        <strong>{line.quantity}</strong>

                        <button
                          type="button"
                          className="backoffice-secondary-button"
                          onClick={() =>
                            changeQuantity(line.key, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td>{line.baseUnits}</td>
                    <td>{formatMoney(line.standardPrice)}</td>
                    <td>{formatMoney(line.lineTotal)}</td>

                    <td>
                      <button
                        type="button"
                        className="backoffice-secondary-button"
                        onClick={() => removeLine(line.key)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="backoffice-form-actions">
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>

          <button
            type="button"
            className="backoffice-primary-button"
            disabled={
              !selectedCustomerId ||
              !selectedLocationId ||
              cartDetails.length === 0
            }
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}