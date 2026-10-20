"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completePosSale } from "@/app/backoffice/pos/actions";

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
  inventoryType: "BATCHED" | "SIMPLE" | "NON_INVENTORY";
  cost: number | null;
  retailPrice: number | null;
  wholesalePrice: number | null;
  tier1Price: number | null;
  tier2Price: number | null;
  tier3Price: number | null;
  unitsPerKit: number;
  quantities: Record<string, number>;
};

type CartLine = {
  key: string;
  productId: string;
  sellUnit: SellUnit;
  quantity: number;
  websiteUnitPrice: number | null;
  manualUnitPrice: number | null;
  priceAdjustmentReason: string;
};

export type PosWebsiteOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  strength: string;
  sellUnit: SellUnit;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  mapped: boolean;
};

export type PosWebsiteOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string | null;
  channel: "RETAIL" | "DISTRO" | "MIXED";
  fulfillmentMethod: "SHIPPING" | "PICKUP" | null;
  shippingAmount: number;
  subtotal: number;
  total: number;
  createdAt: string;
  items: PosWebsiteOrderItem[];
};

type Props = {
  customers: PosCustomer[];
  locations: PosLocation[];
  products: PosProduct[];
  websiteOrders: PosWebsiteOrder[];
};

function getWholesalePrice(product: PosProduct) {
  if (product.wholesalePrice !== null) {
    return product.wholesalePrice;
  }

  return product.retailPrice === null
    ? null
    : product.retailPrice * 0.8;
}

function getTierKitPrice(
  product: PosProduct,
  pricingType: PricingType
) {
  if (pricingType === "TIER_1") {
    return product.tier1Price ??
      (product.cost === null
        ? null
        : Math.ceil(product.cost * 1.4));
  }

  if (pricingType === "TIER_2") {
    return product.tier2Price ??
      (product.cost === null
        ? null
        : Math.ceil(product.cost * 1.35));
  }

  if (pricingType === "TIER_3") {
    return product.tier3Price ??
      (product.cost === null
        ? null
        : Math.ceil(product.cost * 1.3));
  }

  return null;
}

function getStandardPrice(
  product: PosProduct,
  pricingType: PricingType,
  sellUnit: SellUnit
) {
  const retailPrice = product.retailPrice;
  const wholesalePrice = getWholesalePrice(product);

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
    return getTierKitPrice(product, pricingType);
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
  websiteOrders,
}: Props) {
  const router = useRouter();
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadedWebsiteOrderId, setLoadedWebsiteOrderId] = useState<string | null>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] =
    useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productSearchOpen, setProductSearchOpen] =
    useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartError, setCartError] = useState<string | null>(
    null
  );
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "ZELLE"
  >("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [zelleReference, setZelleReference] = useState("");
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [completedInvoiceNumber, setCompletedInvoiceNumber] =
    useState<string | null>(null);

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

  const customerResults = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return [];
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
      .slice(0, 8);
  }, [customers, customerSearch]);

  const productResults = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return products
      .filter((product) =>
        `${product.name} ${product.sku}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 12);
  }, [products, productSearch]);

  function getBaseUnits(
    product: PosProduct,
    sellUnit: SellUnit,
    quantity: number
  ) {
    const multiplier =
      sellUnit === "KIT" ? product.unitsPerKit : 1;

    return quantity * multiplier;
  }

  function getProductCartUnits(
    productId: string,
    nextCart: CartLine[]
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

  function validateInventory(
    product: PosProduct,
    nextCart: CartLine[]
  ) {
    if (!selectedLocationId) {
      setCartError("Select an inventory location first.");
      return false;
    }

    if (product.inventoryType === "NON_INVENTORY") {
      return true;
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

  function selectCustomer(customer: PosCustomer) {
    setSelectedCustomerId(customer.id);
    setCustomerSearch("");
    setCustomerSearchOpen(false);
    setCartError(null);

    if (loadedWebsiteOrderId) {
      setCartError(
        "Website order items are locked. Clear the cart to start a manual sale."
      );
      return;
    }
  }

  function clearCustomer() {
    setSelectedCustomerId("");
    setCustomerSearch("");
    setCustomerSearchOpen(false);
    setCartError(null);
  }

  function handleLocationChange(locationId: string) {
    const isChangingExistingLocation =
      Boolean(selectedLocationId) &&
      locationId !== selectedLocationId;

    if (cart.length > 0 && isChangingExistingLocation) {
      const confirmed = window.confirm(
        "Changing inventory location will clear the current cart. Continue?"
      );

      if (!confirmed) {
        return;
      }

      setCart([]);
      setLoadedWebsiteOrderId(null);
    }

    setSelectedLocationId(locationId);
    setCartError(null);
  }

  function loadWebsiteOrder(order: PosWebsiteOrder) {
    setCartError(null);
    setSaleError(null);
    setCompletedInvoiceNumber(null);

    if (!order.customerId) {
      setCartError(
        `Website order ${order.orderNumber} does not have a matching active Back Office customer.`
      );
      return;
    }

    const unmappedItem = order.items.find(
      (item) => !item.mapped || !item.productId
    );

    if (unmappedItem) {
      setCartError(
        `Website order ${order.orderNumber} needs product mapping for ${unmappedItem.productName}.`
      );
      return;
    }

    const nextCart: CartLine[] = order.items.map((item) => ({
      key: getCartKey(item.productId as string, item.sellUnit),
      productId: item.productId as string,
      sellUnit: item.sellUnit,
      quantity: item.quantity,
      websiteUnitPrice: item.unitPrice,
      manualUnitPrice: null,
      priceAdjustmentReason: "",
    }));

    setLoadedWebsiteOrderId(order.id);
    setSelectedCustomerId(order.customerId);
    setCustomerSearch("");
    setCustomerSearchOpen(false);
    setSelectedLocationId("");
    setCart(nextCart);
    setProductSearch("");
    setProductSearchOpen(false);
    setDiscountPercent("");
    setDiscountAmount("");
    setPaymentOpen(false);
    setPaymentMethod("CASH");
    setAmountReceived("");
    setZelleReference("");
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
            ? {
                ...line,
                quantity: line.quantity + 1,
              }
            : line
        )
      : [
          ...cart,
          {
            key,
            productId: product.id,
            sellUnit,
            quantity: 1,
            websiteUnitPrice: null,
            manualUnitPrice: null,
            priceAdjustmentReason: "",
          },
        ];

    if (!validateInventory(product, nextCart)) {
      return;
    }

    setCart(nextCart);
    setProductSearch("");
    setProductSearchOpen(false);
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
        ? {
            ...item,
            quantity: nextQuantity,
          }
        : item
    );

    if (!validateInventory(product, nextCart)) {
      return;
    }

    setCart(nextCart);
  }

  function removeLine(key: string) {
    setCartError(null);
    setCart(cart.filter((line) => line.key !== key));
  }

  function setManualPrice(
    key: string,
    value: string
  ) {
    const trimmed = value.trim();

    if (!trimmed) {
      setCart((current) =>
        current.map((line) =>
          line.key === key
            ? {
                ...line,
                manualUnitPrice: null,
              }
            : line
        )
      );
      return;
    }

    const price = Number(trimmed);

    if (!Number.isFinite(price) || price < 0) {
      return;
    }

    setCart((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              manualUnitPrice: price,
            }
          : line
      )
    );
  }

  function setPriceAdjustmentReason(
    key: string,
    reason: string
  ) {
    setCart((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              priceAdjustmentReason: reason,
            }
          : line
      )
    );
  }

  function resetManualPrice(key: string) {
    setCart((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              manualUnitPrice: null,
              priceAdjustmentReason: "",
            }
          : line
      )
    );
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

        const unitPrice =
          line.manualUnitPrice ?? line.websiteUnitPrice ?? standardPrice;

        return [
          {
            ...line,
            product,
            standardPrice,
            unitPrice,
            priceAdjusted: line.manualUnitPrice !== null,
            baseUnits,
            lineTotal: unitPrice * line.quantity,
          },
        ];
      }),
    [cart, products, pricingType]
  );

  const loadedWebsiteOrder = websiteOrders.find(
    (order) => order.id === loadedWebsiteOrderId
  );

  const shippingAmount =
    loadedWebsiteOrder?.fulfillmentMethod === "SHIPPING"
      ? 20
      : 0;

  const subtotal = useMemo(
    () =>
      cartDetails.reduce(
        (total, line) => total + line.lineTotal,
        0
      ) + shippingAmount,
    [cartDetails, shippingAmount]
  );

  const calculatedDiscount = useMemo(() => {
    const percent = Number(discountPercent);
    const amount = Number(discountAmount);

    if (
      discountPercent.trim() &&
      Number.isFinite(percent) &&
      percent > 0
    ) {
      return Math.min(
        subtotal,
        subtotal * (Math.min(percent, 100) / 100)
      );
    }

    if (
      discountAmount.trim() &&
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return Math.min(subtotal, amount);
    }

    return 0;
  }, [discountPercent, discountAmount, subtotal]);

  const total = Math.max(
    0,
    subtotal - calculatedDiscount
  );

  const receivedAmount = (() => {
    const amount = Number(amountReceived);

    if (
      !amountReceived.trim() ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return 0;
    }

    return amount;
  })();

  const balanceDue = Math.max(
    0,
    total - receivedAmount
  );

  function handleDiscountPercent(value: string) {
    setDiscountPercent(value);

    if (value.trim()) {
      setDiscountAmount("");
    }
  }

  function handleDiscountAmount(value: string) {
    setDiscountAmount(value);

    if (value.trim()) {
      setDiscountPercent("");
    }
  }

  async function handleCompleteSale() {
    if (
      saleSubmitting ||
      !selectedCustomerId ||
      !selectedLocationId ||
      cartDetails.length === 0
    ) {
      return;
    }

    const invalidAdjustment = cartDetails.find(
      (line) =>
        line.priceAdjusted &&
        !line.priceAdjustmentReason.trim()
    );

    if (invalidAdjustment) {
      setSaleError(
        `Enter a price adjustment reason for ${invalidAdjustment.product.name}.`
      );
      return;
    }

    if (receivedAmount > total) {
      setSaleError(
        "Amount received cannot exceed the sale total."
      );
      return;
    }

    setSaleSubmitting(true);
    setSaleError(null);
    setCompletedInvoiceNumber(null);

    try {
      const result = await completePosSale({
        websiteOrderId: loadedWebsiteOrderId,
        customerId: selectedCustomerId,
        locationId: selectedLocationId,
        items: cartDetails.map((line) => ({
          productId: line.productId,
          sellUnit: line.sellUnit,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          priceAdjustmentReason:
            line.priceAdjusted
              ? line.priceAdjustmentReason.trim()
              : null,
        })),
        discountPercent:
          discountPercent.trim()
            ? Number(discountPercent)
            : null,
        discountAmount:
          discountAmount.trim()
            ? Number(discountAmount)
            : null,
        payment:
          receivedAmount > 0
            ? {
                method: paymentMethod,
                amount: receivedAmount,
                zelleReference:
                  paymentMethod === "ZELLE"
                    ? zelleReference.trim() || null
                    : null,
              }
            : null,
      });

      if (!result.success) {
        setSaleError(result.error);
        return;
      }

      setCompletedInvoiceNumber(result.invoiceNumber);
      router.refresh();
      setCart([]);
      setLoadedWebsiteOrderId(null);
      setDiscountPercent("");
      setDiscountAmount("");
      setAmountReceived("");
      setZelleReference("");
      setPaymentMethod("CASH");
      setPaymentOpen(false);
    } catch {
      setSaleError(
        "Unable to complete the sale. Please try again."
      );
    } finally {
      setSaleSubmitting(false);
    }
  }

  return (
    <div className="pos-register">
      <section className="pos-setup-card">
        <div className="pos-setup-grid">

          <div className="pos-website-orders">
            <div className="pos-section-heading">
              <div>
                <span>WEBSITE ORDERS</span>
                <h2>Load Order</h2>
              </div>
            </div>

            {websiteOrders.length === 0 ? (
              <div className="pos-search-empty">
                No website orders waiting for POS.
              </div>
            ) : (
              <select
                defaultValue=""
                onChange={(event) => {
                  const order = websiteOrders.find(
                    (item) => item.id === event.target.value
                  );

                  if (order) {
                    loadWebsiteOrder(order);
                  }

                  event.currentTarget.value = "";
                }}
              >
                <option value="">Select website order...</option>

                {websiteOrders.map((order) => {
                  const hasMappingIssue =
                    !order.customerId ||
                    order.items.some((item) => !item.mapped);

                  return (
                    <option key={order.id} value={order.id}>
                      {order.customerName} - {formatMoney(order.total)}
                      {hasMappingIssue ? " - NEEDS MAPPING" : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>


          <div className="pos-field pos-search-wrap">
            <span>Customer</span>

            {selectedCustomer ? (
              <div className="pos-selected-customer">
                <div>
                  <strong>
                    {selectedCustomer.firstName}{" "}
                    {selectedCustomer.lastName}
                  </strong>

                  <small>
                    {selectedCustomer.company
                      ? `${selectedCustomer.company} - `
                      : ""}
                    {selectedCustomer.pricingType.replaceAll(
                      "_",
                      " "
                    )}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={clearCustomer}
                  aria-label="Change customer"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="search"
                  value={customerSearch}
                  onFocus={() => setCustomerSearchOpen(true)}
                  onChange={(event) => {
                    setCustomerSearch(event.target.value);
                    setCustomerSearchOpen(true);
                  }}
                  placeholder="Search name, phone, email..."
                  autoComplete="off"
                />

                <Link
                  href="/backoffice/customers/new"
                  className="pos-add-customer-link"
                >
                  + Add New Customer
                </Link>

                {customerSearchOpen &&
                customerSearch.trim() ? (
                  <div className="pos-search-results">
                    {customerResults.length > 0 ? (
                      customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="pos-search-result"
                          onClick={() =>
                            selectCustomer(customer)
                          }
                        >
                          <span>
                            <strong>
                              {customer.firstName}{" "}
                              {customer.lastName}
                            </strong>

                            <small>
                              {[
                                customer.company,
                                customer.phone,
                                customer.email,
                              ]
                                .filter(Boolean)
                                .join(" - ") || "No contact info"}
                            </small>
                          </span>

                          <em>
                            {customer.pricingType.replaceAll(
                              "_",
                              " "
                            )}
                          </em>
                        </button>
                      ))
                    ) : (
                      <div className="pos-search-empty">
                        No customers found.
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        
          <label className="pos-field">
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
          </label>

            <section className="pos-product-panel">
          <div className="pos-section-heading">
            <div>
              <span>ADD ITEMS</span>
              <h2>Inventory Search</h2>
            </div>
          </div>

          <div className="pos-product-search pos-search-wrap">
            <input
              type="search"
              value={productSearch}
              onFocus={() => setProductSearchOpen(true)}
              onChange={(event) => {
                setProductSearch(event.target.value);
                setProductSearchOpen(true);
              }}
              placeholder="Search product name or SKU..."
              autoComplete="off"
            />

            {productSearchOpen && productSearch.trim() ? (
              <div className="pos-search-results pos-product-results">
                {productResults.length > 0 ? (
                  productResults.map((product) => {
                    const available =
                      product.inventoryType === "NON_INVENTORY"
                        ? null
                        : selectedLocationId
                          ? product.quantities[
                              selectedLocationId
                            ] ?? 0
                          : null;

                    const unitPrice = getStandardPrice(
                      product,
                      pricingType,
                      "UNIT"
                    );

                    const kitPrice =
                      product.inventoryType === "BATCHED"
                        ? getStandardPrice(
                            product,
                            pricingType,
                            "KIT"
                          )
                        : null;

                    const unitDisabled =
                      !selectedLocationId ||
                      unitPrice === null ||
                      (product.inventoryType !==
                        "NON_INVENTORY" &&
                        available === 0);

                    return (
                      <div
                        key={product.id}
                        className="pos-product-result"
                      >
                        <div className="pos-product-info">
                          <strong>{product.name}</strong>

                          <small>
                            {product.sku}
                            {" - "}
                            {product.inventoryType ===
                            "NON_INVENTORY"
                              ? "Non-Inventory"
                              : available === null
                                ? "Select location"
                                : `${available} available`}
                          </small>
                        </div>

                        <div className="pos-product-actions">
                          <button
                            type="button"
                            disabled={unitDisabled}
                            onClick={() =>
                              addToCart(product, "UNIT")
                            }
                          >
                            <span>UNIT</span>
                            <strong>
                              {formatMoney(unitPrice)}
                            </strong>
                          </button>

                          {product.inventoryType === "BATCHED" ? (
                            <button
                              type="button"
                              disabled={
                                !selectedLocationId ||
                                kitPrice === null ||
                                available === null ||
                                available <
                                  product.unitsPerKit
                              }
                              onClick={() =>
                                addToCart(product, "KIT")
                              }
                            >
                              <span>
                                KIT x{product.unitsPerKit}
                              </span>
                              <strong>
                                {formatMoney(kitPrice)}
                              </strong>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="pos-search-empty">
                    No inventory matches your search.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>
</div>
      </section>
        <div className="pos-workspace">
          <section className="pos-cart-panel">
          <div className="pos-section-heading">
            <div>
              <span>CURRENT SALE</span>
              <h2>Cart</h2>
            </div>

            {cart.length > 0 ? (
              <button
                type="button"
                className="pos-clear-button"
                onClick={() => {
                  setCart([]);
                  setLoadedWebsiteOrderId(null);
                  setCartError(null);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>

          {cartError ? (
            <div className="pos-error">{cartError}</div>
          ) : null}

          {cartDetails.length === 0 ? (
            <div className="pos-empty-cart">
              <strong>Cart is empty</strong>
              <span>
                Search inventory and add a unit or kit.
              </span>
            </div>
          ) : (
            <div className="pos-cart-lines">
              {cartDetails.map((line) => (
                <div
                  key={line.key}
                  className="pos-cart-line"
                >
                  <div className="pos-cart-product">
                    <strong>{line.product.name}</strong>
                      <span className="pos-cart-sku">
                        SKU: {line.product.sku}
                      </span>

                    <span>
                      {line.sellUnit === "KIT"
                        ? `Kit x${line.product.unitsPerKit}`
                        : "Single Unit"}
                      {" - "}
                      {formatMoney(line.standardPrice)}
                    </span>
                  </div>

                  <div className="pos-price-adjustment">
                    <label>
                      <span>Sale Price</span>
                      <div className="pos-price-input-wrap">
                        <span>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            line.manualUnitPrice ??
                            line.websiteUnitPrice ??
                            line.standardPrice
                          }
                          onChange={(event) =>
                            setManualPrice(
                              line.key,
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </label>

                    {line.priceAdjusted ? (
                      <>
                        <label>
                          <span>Reason</span>
                          <input
                            type="text"
                            value={line.priceAdjustmentReason}
                            onChange={(event) =>
                              setPriceAdjustmentReason(
                                line.key,
                                event.target.value
                              )
                            }
                            placeholder="Price adjustment reason"
                          />
                        </label>

                        <button
                          type="button"
                          className="pos-price-reset"
                          onClick={() =>
                            resetManualPrice(line.key)
                          }
                        >
                          Reset
                        </button>
                      </>
                    ) : null}
                  </div>

                  <div className="pos-cart-quantity">
                    <button
                      type="button"
                      disabled={false}
                      onClick={() =>
                        changeQuantity(line.key, -1)
                      }
                    >
                      -
                    </button>

                    <strong>{line.quantity}</strong>

                    <button
                      type="button"
                      disabled={false}
                      onClick={() =>
                        changeQuantity(line.key, 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="pos-cart-line-total">
                    <strong>
                      {formatMoney(line.lineTotal)}
                    </strong>

                    <small>
                      {line.baseUnits} physical{" "}
                      {line.baseUnits === 1
                        ? "unit"
                        : "units"}
                    </small>
                  </div>

                  <button
                    type="button"
                      disabled={false}
                    className="pos-remove-line"
                    onClick={() => removeLine(line.key)}
                    aria-label={`Remove ${line.product.name}`}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pos-cart-summary">
            {shippingAmount > 0 ? (
              <div>
                <span>Shipping</span>
                <strong>{formatMoney(shippingAmount)}</strong>
              </div>
            ) : null}

            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>

            <div className="pos-discount-controls">
              <label>
                <span>Discount %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(event) =>
                    handleDiscountPercent(event.target.value)
                  }
                  placeholder="0"
                />
              </label>

              <label>
                <span>Discount $</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(event) =>
                    handleDiscountAmount(event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
            </div>

            {calculatedDiscount > 0 ? (
              <div>
                <span>Discount</span>
                <strong>
                  -{formatMoney(calculatedDiscount)}
                </strong>
              </div>
            ) : null}

            <div className="pos-cart-total">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>

            {!paymentOpen ? (
              <button
                type="button"
                className="pos-checkout-button"
                disabled={
                  !selectedCustomerId ||
                  !selectedLocationId ||
                  cartDetails.length === 0
                }
                onClick={() => setPaymentOpen(true)}
              >
                Continue to Payment
              </button>
            ) : (
              <div className="pos-payment-panel">
                  <div className="pos-payment-row">
                    <div className="pos-payment-control">
                      <span>Cash</span>
                      <button
                        type="button"
                        className={`pos-payment-choice ${
                          paymentMethod === "CASH" ? "active" : ""
                        }`}
                        onClick={() => {
                          setPaymentMethod("CASH");
                          setZelleReference("");
                        }}
                      >
                        Cash
                      </button>
                    </div>

                    <div className="pos-payment-control">
                      <span>Zelle</span>
                      <button
                        type="button"
                        className={`pos-payment-choice ${
                          paymentMethod === "ZELLE" ? "active" : ""
                        }`}
                        onClick={() => setPaymentMethod("ZELLE")}
                      >
                        Zelle
                      </button>
                    </div>

                    <label className="pos-payment-control">
                      <span>Amount Received</span>
                      <div className="pos-payment-amount">
                        <span>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountReceived}
                          onChange={(event) =>
                            setAmountReceived(event.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </label>

                    <label
                      className={`pos-payment-control ${
                        paymentMethod !== "ZELLE"
                          ? "pos-payment-control-muted"
                          : ""
                      }`}
                    >
                      <span>Zelle Reference</span>
                      <input
                        type="text"
                        value={zelleReference}
                        onChange={(event) =>
                          setZelleReference(event.target.value)
                        }
                        placeholder={
                          paymentMethod === "ZELLE"
                            ? "Reference"
                            : "N/A"
                        }
                        disabled={paymentMethod !== "ZELLE"}
                      />
                    </label>

                    <div className="pos-payment-control">
                      <span>Received</span>
                      <div className="pos-payment-value">
                        {formatMoney(receivedAmount)}
                      </div>
                    </div>

                    <div className="pos-payment-control">
                      <span>Balance Due</span>
                      <div className="pos-payment-value">
                        {formatMoney(balanceDue)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pos-checkout-button"
                    onClick={handleCompleteSale}
                    disabled={
                      saleSubmitting ||
                      !selectedCustomerId ||
                      !selectedLocationId ||
                      cartDetails.length === 0
                    }
                  >
                    {saleSubmitting
                      ? "Completing Sale..."
                      : "Complete Sale"}
                  </button>

                  {saleError ? (
                    <small className="pos-error">
                      {saleError}
                    </small>
                  ) : null}


                </div>
            )}
            {completedInvoiceNumber ? (
              <small>
                Sale completed: {completedInvoiceNumber}
              </small>
            ) : null}


            {!selectedCustomerId ? (
              <small>Select a customer to continue.</small>
            ) : !selectedLocationId ? (
              <small>
                Select an inventory location to continue.
              </small>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
