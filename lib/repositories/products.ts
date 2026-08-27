import { prisma } from "@/lib/prisma";

function normalizeComposition(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );

  return items.length > 0 ? items : undefined;
}

function mapProduct<
  T extends {
    id: string;
    slug: string;
    name: string;
    strength: string;
    category: string;
    image: string | null;
    overview: string;
    composition: unknown;
    presentation: string;
    storage: string;
    featured: boolean;
    purchasable: boolean;
    trackInventory: boolean;
    inventoryQty: number;
    memberPrice: unknown;
    literature: {
      title: string;
      journal: string;
      year: number;
      type: string;
      url: string;
    }[];
    variants: {
      id: string;
      strength: string;
      sku: string | null;
      memberPrice: unknown;
      inventoryQty: number;
      lowStockAt: number;
      active: boolean;
      purchasable: boolean;
      sortOrder: number;
    }[];
  }
>(product: T) {
  const variants = product.variants.map((variant) => {
    const memberPrice =
      variant.memberPrice !== null
        ? Number(variant.memberPrice)
        : null;

    return {
      id: variant.id,
      strength: variant.strength,
      sku: variant.sku,
      memberPrice,
      inventoryQty: variant.inventoryQty,
      lowStockAt: variant.lowStockAt,
      active: variant.active,
      purchasable: variant.purchasable,

      available:
        variant.purchasable &&
        memberPrice !== null &&
        (
          !product.trackInventory ||
          variant.inventoryQty > 0
        ),

      sortOrder: variant.sortOrder,
    };
  });

  const firstAvailableVariant =
    variants.find((variant) => variant.available) ??
    variants[0] ??
    null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    strength: product.strength,
    category: product.category,
    image: product.image ?? "/bottles/placeholder.png",
    featured: product.featured,
    overview: product.overview,
    composition: normalizeComposition(product.composition),
    presentation: product.presentation,
    storage: product.storage,
    literature: product.literature,

    commerceProductId: product.id,

    memberPrice:
      firstAvailableVariant?.memberPrice ??
      (
        product.memberPrice !== null
          ? Number(product.memberPrice)
          : null
      ),

    purchasable:
      variants.length > 0
        ? variants.some((variant) => variant.available)
        : product.purchasable,

    trackInventory: product.trackInventory,

    inventoryQty:
      variants.length > 0
        ? variants.reduce(
            (total, variant) =>
              total + variant.inventoryQty,
            0
          )
        : product.inventoryQty,

    variants,
  };
}

const productSelect = {
  id: true,
  slug: true,
  name: true,
  strength: true,
  category: true,
  image: true,
  overview: true,
  composition: true,
  presentation: true,
  storage: true,
  featured: true,
  purchasable: true,
  trackInventory: true,
  inventoryQty: true,
  memberPrice: true,

  literature: {
    orderBy: [
      {
        year: "desc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],
    select: {
      title: true,
      journal: true,
      year: true,
      type: true,
      url: true,
    },
  },

  variants: {
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
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
};

export async function getProducts() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: productSelect,
  });

  return products.map(mapProduct);
}

export async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      featured: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: productSelect,
  });

  return products.map(mapProduct);
}

export async function getProduct(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      active: true,
    },
    select: productSelect,
  });

  if (!product) {
    return null;
  }

  return mapProduct(product);
}