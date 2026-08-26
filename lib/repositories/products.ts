import { compounds } from "../data/compounds";
import { prisma } from "@/lib/prisma";

async function getCommerceProducts() {
  return prisma.product.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      slug: true,
      memberPrice: true,
      purchasable: true,
      trackInventory: true,
      inventoryQty: true,

      variants: {
        where: {
          active: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          id: true,
          strength: true,
          sku: true,
          memberPrice: true,
          inventoryQty: true,
          lowStockAt: true,
          active: true,
          purchasable: true,
          sortOrder: true,
        },
      },
    },
  });
}

function mergeCommerceData<
  T extends (typeof compounds)[number]
>(
  compound: T,
  commerceProducts: Awaited<
    ReturnType<typeof getCommerceProducts>
  >
) {
  const commerce = commerceProducts.find(
    (product) => product.slug === compound.slug
  );

  const variants =
    commerce?.variants.map((variant) => ({
      id: variant.id,
      strength: variant.strength,
      sku: variant.sku,

      memberPrice:
        variant.memberPrice !== null
          ? Number(variant.memberPrice)
          : null,

      inventoryQty: variant.inventoryQty,
      lowStockAt: variant.lowStockAt,
      active: variant.active,
      purchasable: variant.purchasable,

      available:
        variant.purchasable &&
        variant.memberPrice !== null &&
        (
          !commerce.trackInventory ||
          variant.inventoryQty > 0
        ),

      sortOrder: variant.sortOrder,
    })) ?? [];

  const firstAvailableVariant =
    variants.find((variant) => variant.available) ??
    variants[0] ??
    null;

  return {
    ...compound,

    commerceProductId: commerce?.id ?? null,

    memberPrice:
      firstAvailableVariant?.memberPrice ??
      (
        commerce?.memberPrice !== null &&
        commerce?.memberPrice !== undefined
          ? Number(commerce.memberPrice)
          : null
      ),

    purchasable:
      variants.length > 0
        ? variants.some((variant) => variant.available)
        : commerce?.purchasable ?? false,

    trackInventory: commerce?.trackInventory ?? false,

    inventoryQty:
      variants.length > 0
        ? variants.reduce(
            (total, variant) =>
              total + variant.inventoryQty,
            0
          )
        : commerce?.inventoryQty ?? 0,

    variants,
  };
}

export async function getProducts() {
  const commerceProducts = await getCommerceProducts();

  return compounds.map((compound) =>
    mergeCommerceData(compound, commerceProducts)
  );
}

export async function getFeaturedProducts() {
  const commerceProducts = await getCommerceProducts();

  return compounds
    .filter((compound) => compound.featured)
    .map((compound) =>
      mergeCommerceData(compound, commerceProducts)
    );
}

export async function getProduct(slug: string) {
  const compound =
    compounds.find((product) => product.slug === slug) ??
    null;

  if (!compound) {
    return null;
  }

  const commerceProducts = await getCommerceProducts();

  return mergeCommerceData(
    compound,
    commerceProducts
  );
}