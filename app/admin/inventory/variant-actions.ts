"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function nonNegativeInteger(
  formData: FormData,
  name: string,
  fallback = 0
) {
  const value = Number(formData.get(name));

  if (!Number.isInteger(value) || value < 0) {
    return fallback;
  }

  return value;
}

function priceValue(formData: FormData) {
  const raw = text(formData, "memberPrice");

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Member price must be zero or greater.");
  }

  return value.toFixed(2);
}

function revalidateProduct(productId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${productId}`);
  revalidatePath("/");
  revalidatePath("/compounds");

  if (slug) {
    revalidatePath(`/compound/${slug}`);
  }
}

export async function createProductVariant(formData: FormData) {
  const productId = text(formData, "productId");
  const strength = text(formData, "strength");

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  if (!strength) {
    throw new Error("Strength is required.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  await prisma.productVariant.create({
    data: {
      productId,
      strength,
      sku: text(formData, "sku") || null,
      memberPrice: priceValue(formData),
      inventoryQty: nonNegativeInteger(
        formData,
        "inventoryQty",
        0
      ),
      lowStockAt: nonNegativeInteger(
        formData,
        "lowStockAt",
        5
      ),
      active: formData.get("active") === "on",
      purchasable:
        formData.get("purchasable") === "on",
      sortOrder: nonNegativeInteger(
        formData,
        "sortOrder",
        0
      ),
    },
  });

  revalidateProduct(productId, product.slug);
}

export async function updateProductVariant(formData: FormData) {
  const id = text(formData, "variantId");

  if (!id) {
    throw new Error("Variant ID is required.");
  }

  const existing = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Variant not found.");
  }

  const strength = text(formData, "strength");

  if (!strength) {
    throw new Error("Strength is required.");
  }

  const inventoryQty = nonNegativeInteger(
    formData,
    "inventoryQty",
    existing.inventoryQty
  );

  await prisma.productVariant.update({
    where: { id },
    data: {
      strength,
      sku: text(formData, "sku") || null,
      memberPrice: priceValue(formData),
      inventoryQty,
      lowStockAt: nonNegativeInteger(
        formData,
        "lowStockAt",
        existing.lowStockAt
      ),
      active: formData.get("active") === "on",
      purchasable:
        formData.get("purchasable") === "on",
      sortOrder: nonNegativeInteger(
        formData,
        "sortOrder",
        existing.sortOrder
      ),
    },
  });

  revalidateProduct(
    existing.productId,
    existing.product.slug
  );
}

export async function deleteProductVariant(formData: FormData) {
  const id = text(formData, "variantId");

  if (!id) {
    throw new Error("Variant ID is required.");
  }

  const existing = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Variant not found.");
  }

  await prisma.productVariant.delete({
    where: { id },
  });

  revalidateProduct(
    existing.productId,
    existing.product.slug
  );
}