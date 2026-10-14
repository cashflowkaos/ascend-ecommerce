"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const validPricingTypes = new Set([
  "RETAIL",
  "WHOLESALE",
  "TIER_1",
  "TIER_2",
  "TIER_3",
]);

export async function updateBackOfficeCustomer(
  formData: FormData
) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const firstName = String(
    formData.get("firstName") ?? ""
  ).trim();
  const lastName = String(
    formData.get("lastName") ?? ""
  ).trim();
  const company = String(
    formData.get("company") ?? ""
  ).trim();
  const email = String(
    formData.get("email") ?? ""
  ).trim();
  const phone = String(
    formData.get("phone") ?? ""
  ).trim();
  const pricingType = String(
    formData.get("pricingType") ?? ""
  ).trim();
  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!id) {
    throw new Error("Customer ID is required.");
  }

  if (!firstName) {
    throw new Error("First name is required.");
  }

  if (!validPricingTypes.has(pricingType)) {
    throw new Error("Invalid customer pricing type.");
  }

  const customer =
    await prisma.backOfficeCustomer.findUnique({
      where: { id },
      select: { id: true },
    });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  await prisma.backOfficeCustomer.update({
    where: { id },
    data: {
      firstName,
      lastName,
      company: company || null,
      email: email || null,
      phone: phone || null,
      pricingType:
        pricingType as
          | "RETAIL"
          | "WHOLESALE"
          | "TIER_1"
          | "TIER_2"
          | "TIER_3",
      notes: notes || null,
    },
  });

  revalidatePath("/backoffice/customers");
  revalidatePath(`/backoffice/customers/${id}`);
}

export async function setBackOfficeCustomerMemberLink(
  formData: FormData
) {
  await requireAdmin();

  const customerId = String(
    formData.get("customerId") ?? ""
  ).trim();

  const userId = String(
    formData.get("userId") ?? ""
  ).trim();

  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  const customer =
    await prisma.backOfficeCustomer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  if (!userId) {
    await prisma.backOfficeCustomer.update({
      where: { id: customerId },
      data: { userId: null },
    });

    revalidatePath("/backoffice/customers");
    revalidatePath(
      `/backoffice/customers/${customerId}`
    );
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Website member not found.");
  }

  const existingLink =
    await prisma.backOfficeCustomer.findFirst({
      where: {
        userId,
        NOT: {
          id: customerId,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

  if (existingLink) {
    throw new Error(
      `That website member is already linked to ${existingLink.firstName} ${existingLink.lastName}. Unlink or merge that customer first.`
    );
  }

  await prisma.backOfficeCustomer.update({
    where: { id: customerId },
    data: { userId },
  });

  revalidatePath("/backoffice/customers");
  revalidatePath(
    `/backoffice/customers/${customerId}`
  );
}

export async function createBackOfficeCustomer(
  formData: FormData
) {
  await requireAdmin();

  const firstName = String(
    formData.get("firstName") ?? ""
  ).trim();
  const lastName = String(
    formData.get("lastName") ?? ""
  ).trim();
  const company = String(
    formData.get("company") ?? ""
  ).trim();
  const email = String(
    formData.get("email") ?? ""
  ).trim();
  const phone = String(
    formData.get("phone") ?? ""
  ).trim();
  const pricingType = String(
    formData.get("pricingType") ?? "RETAIL"
  ).trim();
  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!firstName) {
    throw new Error("First name is required.");
  }

  if (!validPricingTypes.has(pricingType)) {
    throw new Error("Invalid customer pricing type.");
  }

  const customer =
    await prisma.backOfficeCustomer.create({
      data: {
        firstName,
        lastName,
        company: company || null,
        email: email || null,
        phone: phone || null,
        pricingType:
          pricingType as
            | "RETAIL"
            | "WHOLESALE"
            | "TIER_1"
            | "TIER_2"
            | "TIER_3",
        notes: notes || null,
      },
      select: {
        id: true,
      },
    });

  revalidatePath("/backoffice/customers");
  redirect(`/backoffice/customers/${customer.id}`);
}

export async function deleteBackOfficeCustomer(
  formData: FormData
) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Customer ID is required.");
  }

  const customer =
    await prisma.backOfficeCustomer.findUnique({
      where: { id },
      select: {
        id: true,
        legacyCustomerId: true,
        firstName: true,
        lastName: true,
      },
    });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  // Migrated customers have historical sales/invoices that have not
  // been imported into the new Back Office yet. Protect them until
  // the Back Office invoice history is available for a definitive
  // history check.
  if (customer.legacyCustomerId !== null) {
    throw new Error(
      "This migrated customer has legacy history and cannot be deleted. Mark the customer inactive instead."
    );
  }

  await prisma.backOfficeCustomer.delete({
    where: { id },
  });

  revalidatePath("/backoffice/customers");
  redirect("/backoffice/customers");
}
