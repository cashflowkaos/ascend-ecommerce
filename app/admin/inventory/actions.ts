"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function parseNonNegativeInteger(
  value: FormDataEntryValue | null,
  fallback: number
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export async function updateInventoryProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Product ID is required.");
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      inventoryQty: true,
      lowStockAt: true,
    },
  });

  if (!existing) {
    throw new Error("Product not found.");
  }

  const inventoryQty = parseNonNegativeInteger(
    formData.get("inventoryQty"),
    existing.inventoryQty
  );

  const lowStockAt = parseNonNegativeInteger(
    formData.get("lowStockAt"),
    existing.lowStockAt
  );

  const rawPrice = String(formData.get("memberPrice") ?? "").trim();

  let memberPrice: string | null = null;

  if (rawPrice !== "") {
    const price = Number(rawPrice);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Member price must be zero or greater.");
    }

    memberPrice = price.toFixed(2);
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        memberPrice,
        inventoryQty,
        lowStockAt,
        active: formData.get("active") === "on",
        purchasable: formData.get("purchasable") === "on",
        featured: formData.get("featured") === "on",
      },
    });

    if (inventoryQty !== existing.inventoryQty) {
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "ADJUSTMENT",
          quantity: inventoryQty - existing.inventoryQty,
          quantityBefore: existing.inventoryQty,
          quantityAfter: inventoryQty,
          note: "Inventory updated from admin panel",
          createdBy: "ADMIN",
        },
      });
    }

    return updated;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
}

