"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  const value = text(formData, name);
  return value === "" ? null : value;
}

function integer(
  formData: FormData,
  name: string,
  fallback: number
) {
  const value = Number(formData.get(name));

  if (!Number.isInteger(value)) {
    return fallback;
  }

  return value;
}





function parseComposition(
  formData: FormData
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const raw = text(formData, "composition");

  if (!raw) {
    return Prisma.JsonNull;
  }

  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    throw new Error(
      "Composition must be valid JSON. Correct the composition field and try again."
    );
  }
}

function validateSlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "Slug may contain lowercase letters, numbers and hyphens only."
    );
  }
}

function productData(formData: FormData) {
  const name = text(formData, "name");
  const strength = text(formData, "strength");
  const category = text(formData, "category");
  const slug = text(formData, "slug").toLowerCase();
  const overview = text(formData, "overview");
  const presentation = text(formData, "presentation");
  const storage = text(formData, "storage");

  if (
    !name ||
    !strength ||
    !category ||
    !slug ||
    !overview ||
    !presentation ||
    !storage
  ) {
    throw new Error("Complete all required product fields.");
  }

  validateSlug(slug);

  return {
    name,
    strength,
    category,
    slug,
    sku: optionalText(formData, "sku"),
    image: optionalText(formData, "image"),
    overview,
    composition: parseComposition(formData),
    presentation,
    storage,
    researchNotice: optionalText(formData, "researchNotice"),
    sortOrder: integer(formData, "sortOrder", 0),
    active: formData.get("active") === "on",
    purchasable: formData.get("purchasable") === "on",
    featured: formData.get("featured") === "on",
    trackInventory: formData.get("trackInventory") === "on",
  };
}

export async function updateProduct(formData: FormData) {
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Product ID is required.");
  }

  const data = productData(formData);

  await prisma.product.update({
    where: { id },
    data,
  });

  revalidatePath("/");
  revalidatePath("/compounds");
  revalidatePath(`/compound/${data.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);

  redirect("/admin/inventory");
}

export async function createProduct(formData: FormData) {
  const data = productData(formData);

  await prisma.product.create({
    data: {
      ...data,
      inventoryQty: 0,
      memberPrice: null,
      lowStockAt: 5,
    },
  });

  revalidatePath("/");
  revalidatePath("/compounds");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");

  redirect("/admin/inventory");
}
