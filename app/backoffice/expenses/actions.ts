"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function parseExpense(formData: FormData) {
  const expenseDateRaw = String(formData.get("expenseDate") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const vendor = String(formData.get("vendor") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const paidFrom = String(formData.get("paidFrom") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!expenseDateRaw) {
    throw new Error("Expense date is required.");
  }

  const expenseDate = new Date(`${expenseDateRaw}T12:00:00`);
  if (Number.isNaN(expenseDate.getTime())) {
    throw new Error("Invalid expense date.");
  }

  if (!category) {
    throw new Error("Category is required.");
  }

  if (!amountRaw) {
    throw new Error("Amount is required.");
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) {
    throw new Error("Invalid expense amount.");
  }

  return {
    expenseDate,
    category,
    vendor: vendor || null,
    description: description || null,
    amount,
    paidFrom: paidFrom || null,
    notes: notes || null,
  };
}

export async function createBackOfficeExpense(formData: FormData) {
  await requireAdmin();

  const data = parseExpense(formData);

  const expense = await prisma.backOfficeExpense.create({
    data,
    select: { id: true },
  });

  revalidatePath("/backoffice/expenses");
  redirect(`/backoffice/expenses/${expense.id}`);
}

export async function updateBackOfficeExpense(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Expense ID is required.");
  }

  const existing = await prisma.backOfficeExpense.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Expense not found.");
  }

  const data = parseExpense(formData);

  await prisma.backOfficeExpense.update({
    where: { id },
    data,
  });

  revalidatePath("/backoffice/expenses");
  revalidatePath(`/backoffice/expenses/${id}`);
}