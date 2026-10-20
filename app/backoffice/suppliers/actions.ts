"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function optional(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function parseSupplier(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Supplier name is required.");
  }

  return {
    name,
    contactName: optional(formData, "contactName"),
    email: optional(formData, "email"),
    phone: optional(formData, "phone"),
    website: optional(formData, "website"),
    addressLine1: optional(formData, "addressLine1"),
    addressLine2: optional(formData, "addressLine2"),
    city: optional(formData, "city"),
    state: optional(formData, "state"),
    postalCode: optional(formData, "postalCode"),
    country: optional(formData, "country"),
    notes: optional(formData, "notes"),
    active: formData.get("active") === "on",
  };
}

export async function createBackOfficeSupplier(formData: FormData) {
  await requireAdmin();

  const data = parseSupplier(formData);

  const supplier = await prisma.backOfficeSupplier.create({
    data,
    select: { id: true },
  });

  revalidatePath("/backoffice/suppliers");
  redirect(`/backoffice/suppliers/${supplier.id}`);
}

export async function updateBackOfficeSupplier(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Supplier ID is required.");
  }

  const existing = await prisma.backOfficeSupplier.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Supplier not found.");
  }

  await prisma.backOfficeSupplier.update({
    where: { id },
    data: parseSupplier(formData),
  });

  revalidatePath("/backoffice/suppliers");
  revalidatePath(`/backoffice/suppliers/${id}`);
}