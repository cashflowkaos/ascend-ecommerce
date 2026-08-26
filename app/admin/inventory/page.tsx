import Link from "next/link";
import {
  PackagePlus,
  Pencil,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],

    include: {
      variants: {
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],

        select: {
          id: true,
          strength: true,
          memberPrice: true,
          inventoryQty: true,
          lowStockAt: true,
          active: true,
          purchasable: true,
        },
      },
    },
  });

  const inventoryFor = (
    product: (typeof products)[number]
  ) => {
    if (product.variants.length > 0) {
      return product.variants.reduce(
        (sum, variant) =>
          sum + variant.inventoryQty,
        0
      );
    }

    return product.inventoryQty;
  };

  const isProductLow = (
    product: (typeof products)[number]
  ) => {
    if (!product.active || !product.trackInventory) {
      return false;
    }

    if (product.variants.length > 0) {
      const activeVariants =
        product.variants.filter(
          (variant) => variant.active
        );

      if (activeVariants.length === 0) {
        return false;
      }

      return activeVariants.some(
        (variant) =>
          variant.inventoryQty <=
          variant.lowStockAt
      );
    }

    return (
      product.inventoryQty <=
      product.lowStockAt
    );
  };

  const priceFor = (
    product: (typeof products)[number]
  ) => {
    const variantPrices = product.variants
      .filter(
        (variant) =>
          variant.active &&
          variant.memberPrice !== null
      )
      .map((variant) =>
        Number(variant.memberPrice)
      );

    if (variantPrices.length === 0) {
      return product.memberPrice !== null
        ? money(Number(product.memberPrice))
        : "—";
    }

    const minimum = Math.min(
      ...variantPrices
    );

    const maximum = Math.max(
      ...variantPrices
    );

    if (minimum === maximum) {
      return money(minimum);
    }

    return `${money(minimum)} – ${money(maximum)}`;
  };

  const totalUnits = products.reduce(
    (sum, product) =>
      sum + inventoryFor(product),
    0
  );

  const lowStock = products.filter(
    isProductLow
  ).length;

  const purchasable = products.filter(
    (product) =>
      product.active &&
      (
        product.variants.length > 0
          ? product.variants.some(
              (variant) =>
                variant.active &&
                variant.purchasable
            )
          : product.purchasable
      )
  ).length;

  return (
    <div>
      <div className="admin-page-heading admin-inventory-heading">
        <div>
          <span className="admin-eyebrow">
            CATALOG
          </span>

          <h1>Inventory</h1>

          <p>
            Review pricing, stock and product availability.
            Open a product to make adjustments.
          </p>
        </div>

        <Link
          href="/admin/inventory/new"
          className="admin-primary-button"
        >
          <PackagePlus size={16} />
          Add Product
        </Link>
      </div>

      <section className="admin-inventory-summary">
        <div>
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>

        <div>
          <span>Total Units</span>
          <strong>{totalUnits}</strong>
        </div>

        <div>
          <span>Low Stock</span>
          <strong>{lowStock}</strong>
        </div>

        <div>
          <span>Purchasable</span>
          <strong>{purchasable}</strong>
        </div>
      </section>

      <section className="admin-panel admin-inventory-panel">
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
              {products.map((product) => {
                const inventory =
                  inventoryFor(product);

                const isLow =
                  isProductLow(product);

                const hasVariants =
                  product.variants.length > 0;

                const active =
                  product.active;

                const canPurchase =
                  active &&
                  (
                    hasVariants
                      ? product.variants.some(
                          (variant) =>
                            variant.active &&
                            variant.purchasable
                        )
                      : product.purchasable
                  );

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-inventory-product">
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {hasVariants
                            ? `${product.variants.length} ${
                                product.variants.length === 1
                                  ? "variant"
                                  : "variants"
                              } · ${product.category}`
                            : `${product.strength} · ${product.category}`}
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
                        {active
                          ? "Active"
                          : "Inactive"}
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
                        {canPurchase
                          ? "Yes"
                          : "No"}
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
                        {product.featured
                          ? "Yes"
                          : "No"}
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}