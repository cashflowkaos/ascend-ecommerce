"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search, X } from "lucide-react";

type InventoryVariant = {
  id: string;
  strength: string;
  memberPrice: number | null;
  inventoryQty: number;
  lowStockAt: number;
  active: boolean;
  purchasable: boolean;
};

type InventoryProduct = {
  id: string;
  name: string;
  strength: string;
  category: string;
  memberPrice: number | null;
  inventoryQty: number;
  lowStockAt: number;
  active: boolean;
  purchasable: boolean;
  featured: boolean;
  trackInventory: boolean;
  variants: InventoryVariant[];
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function inventoryFor(product: InventoryProduct) {
  if (product.variants.length > 0) {
    return product.variants.reduce(
      (sum, variant) => sum + variant.inventoryQty,
      0
    );
  }

  return product.inventoryQty;
}

function isProductLow(product: InventoryProduct) {
  if (!product.active || !product.trackInventory) {
    return false;
  }

  if (product.variants.length > 0) {
    const activeVariants = product.variants.filter(
      (variant) => variant.active
    );

    if (activeVariants.length === 0) {
      return false;
    }

    return activeVariants.some(
      (variant) =>
        variant.inventoryQty <= variant.lowStockAt
    );
  }

  return product.inventoryQty <= product.lowStockAt;
}

function priceFor(product: InventoryProduct) {
  const variantPrices = product.variants
    .filter(
      (variant) =>
        variant.active &&
        variant.memberPrice !== null
    )
    .map((variant) => Number(variant.memberPrice));

  if (variantPrices.length === 0) {
    return product.memberPrice !== null
      ? money(Number(product.memberPrice))
      : "-";
  }

  const minimum = Math.min(...variantPrices);
  const maximum = Math.max(...variantPrices);

  if (minimum === maximum) {
    return money(minimum);
  }

  return `${money(minimum)} - ${money(maximum)}`;
}

export default function InventoryTable({
  products,
}: {
  products: InventoryProduct[];
}) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const searchable = [
        product.name,
        product.category,
        product.strength,
        ...product.variants.map(
          (variant) => variant.strength
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [products, search]);

  return (
    <section className="admin-panel admin-inventory-panel">
      <div className="border-b border-neutral-200 p-4 sm:p-5">
        <div className="relative max-w-md">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search compounds..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#D4A11E] focus:ring-2 focus:ring-[#D4A11E]/10"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {search && (
          <p className="mt-2 text-xs text-neutral-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "product"
              : "products"}{" "}
            found
          </p>
        )}
      </div>

      <div className="admin-inventory-table-wrap">
        <table className="admin-inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Member Price</th>
              <th>Inventory</th>
              <th>Active</th>
              <th>Purchasable</th>
              <th>Featured</th>
              <th>Edit</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => {
              const inventory = inventoryFor(product);
              const isLow = isProductLow(product);
              const hasVariants =
                product.variants.length > 0;

              const active = product.active;

              const canPurchase =
                active &&
                (hasVariants
                  ? product.variants.some(
                      (variant) =>
                        variant.active &&
                        variant.purchasable
                    )
                  : product.purchasable);

              return (
                <tr key={product.id}>
                  <td>
                    <div className="admin-inventory-product">
                      <strong>{product.name}</strong>

                      <span>
                        {hasVariants
                          ? `${product.variants.length} ${
                              product.variants.length === 1
                                ? "variant"
                                : "variants"
                            } \u00B7 ${product.category}`
                          : `${product.strength} \u00B7 ${product.category}`}
                      </span>
                    </div>
                  </td>

                  <td>
                    <strong className="text-sm font-medium text-neutral-900">
                      {priceFor(product)}
                    </strong>
                  </td>

                  <td>
                    <div>
                      <strong
                        className={
                          isLow
                            ? "text-sm font-semibold text-red-600"
                            : "text-sm font-semibold text-neutral-900"
                        }
                      >
                        {inventory}
                      </strong>

                      <span className="ml-1 text-xs text-neutral-400">
                        units
                      </span>

                      {isLow && (
                        <span className="ml-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-600">
                          Low
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      className={
                        active
                          ? "inline-flex rounded-full bg-green-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-green-700"
                          : "inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
                      }
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        canPurchase
                          ? "inline-flex rounded-full bg-green-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-green-700"
                          : "inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
                      }
                    >
                      {canPurchase ? "Yes" : "No"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        product.featured
                          ? "inline-flex rounded-full bg-[#D4A11E]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9a7312]"
                          : "inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
                      }
                    >
                      {product.featured ? "Yes" : "No"}
                    </span>
                  </td>

                  <td>
                    <Link
                      href={`/admin/inventory/${product.id}`}
                      className="admin-edit-button"
                      title={`Edit ${product.name}`}
                    >
                      <Pencil size={15} />
                    </Link>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-sm text-neutral-500"
                >
                  No compounds found for "{search}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
