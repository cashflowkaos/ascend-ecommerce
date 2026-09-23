import Link from "next/link";
import {
  PackagePlus,
  Pencil,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import InventoryTable from "@/components/admin/InventoryTable";

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
        : "-";
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

    return `${money(minimum)} - ${money(maximum)}`;
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

      <InventoryTable
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          strength: product.strength,
          category: product.category,
          memberPrice:
            product.memberPrice !== null
              ? Number(product.memberPrice)
              : null,
          inventoryQty: product.inventoryQty,
          lowStockAt: product.lowStockAt,
          active: product.active,
          purchasable: product.purchasable,
          featured: product.featured,
          trackInventory: product.trackInventory,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            strength: variant.strength,
            memberPrice:
              variant.memberPrice !== null
                ? Number(variant.memberPrice)
                : null,
            inventoryQty: variant.inventoryQty,
            lowStockAt: variant.lowStockAt,
            active: variant.active,
            purchasable: variant.purchasable,
          })),
        }))}
      />
    </div>
  );
}
