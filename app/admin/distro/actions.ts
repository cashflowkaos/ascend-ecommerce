"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalMoney(formData: FormData, name: string) {
  const raw = text(formData, name);

  if (!raw) return null;

  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or greater.`);
  }

  return value;
}

function calculatedPrice(
  override: number | null,
  cost: number | null,
  markup: number
) {
  if (override !== null) {
    return Math.ceil(override).toFixed(2);
  }

  if (cost === null) return null;

  return Math.ceil(cost * markup).toFixed(2);
}

export async function updateDistroItem(formData: FormData) {
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Distro product ID is required.");
  }

  const name = text(formData, "name");
  const sku = text(formData, "sku").toUpperCase();
  const description = text(formData, "description");

  if (!name) {
    throw new Error("Compound name is required.");
  }

  if (!sku) {
    throw new Error("SKU is required.");
  }

  const cost = optionalMoney(formData, "cost");
  const tier1Override = optionalMoney(formData, "tier1");
  const tier2Override = optionalMoney(formData, "tier2");
  const tier3Override = optionalMoney(formData, "tier3");

  const stockRaw = text(formData, "inventoryQty");
  const inventoryQty = Number(stockRaw);

  if (!Number.isInteger(inventoryQty) || inventoryQty < 0) {
    throw new Error("Distro stock must be a whole number of zero or greater.");
  }

  await prisma.distroProduct.update({
    where: { id },
    data: {
      name,
      sku,
      description,
      cost: cost === null ? null : cost.toFixed(2),
      tier1Price: calculatedPrice(tier1Override, cost, 1.4),
      tier2Price: calculatedPrice(tier2Override, cost, 1.35),
      tier3Price: calculatedPrice(tier3Override, cost, 1.3),
      inventoryQty,
      enabled: formData.get("enabled") === "on",
      available: formData.get("available") === "on",
    },
  });

  revalidatePath("/admin/distro");
}


export async function createDistroItem(formData: FormData) {
  const name = text(formData, "name");
  const sku = text(formData, "sku").toUpperCase();
  const description = text(formData, "description");
  const batchNumber = text(formData, "batchNumber");
  const cost = optionalMoney(formData, "cost");

  const stockRaw = text(formData, "inventoryQty");
  const inventoryQty = stockRaw === "" ? 0 : Number(stockRaw);

  if (!name) {
    throw new Error("Compound name is required.");
  }

  if (!sku) {
    throw new Error("SKU is required.");
  }

  if (!Number.isInteger(inventoryQty) || inventoryQty < 0) {
    throw new Error("Distro stock must be a whole number of zero or greater.");
  }

  const existing = await prisma.distroProduct.findUnique({
    where: { sku },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`A Distro product with SKU ${sku} already exists.`);
  }

  const lastProduct = await prisma.distroProduct.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.distroProduct.create({
    data: {
      name,
      sku,
      description,
      cost: cost === null ? null : cost.toFixed(2),
      tier1Price: calculatedPrice(null, cost, 1.4),
      tier2Price: calculatedPrice(null, cost, 1.35),
      tier3Price: calculatedPrice(null, cost, 1.3),
      inventoryQty,
      enabled: true,
      available: true,
      sortOrder: (lastProduct?.sortOrder ?? -1) + 1,

      batches: batchNumber
        ? {
            create: {
              batchNumber,
            },
          }
        : undefined,
    },
  });

  revalidatePath("/admin/distro");
}

export async function deleteDistroItem(formData: FormData) {
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Distro product ID is required.");
  }

  await prisma.distroProduct.delete({
    where: { id },
  });

  revalidatePath("/admin/distro");
}
