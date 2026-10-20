"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ASCEND_STARTUP_CAPITAL = 2339;
const COMPANY_START = new Date(2026, 3, 1);

export async function createBackOfficeReconciliation(
  formData: FormData
) {
  const currentUser = await requireAdmin();

  const actualCashRaw = String(
    formData.get("actualCash") ?? ""
  ).trim();

  const actualBankRaw = String(
    formData.get("actualBank") ?? ""
  ).trim();

  const note = String(
    formData.get("note") ?? ""
  ).trim();

  const actualCash = Number(actualCashRaw);
  const actualBank = Number(actualBankRaw);

  if (
    !Number.isFinite(actualCash) ||
    !Number.isFinite(actualBank)
  ) {
    throw new Error("Invalid cash or bank balance.");
  }

  if (actualCash < 0 || actualBank < 0) {
    throw new Error(
      "Cash and bank balances cannot be negative."
    );
  }

  const [invoices, expenseResult] = await Promise.all([
    prisma.backOfficeInvoice.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          {
            completedAt: {
              gte: COMPANY_START,
            },
          },
          {
            completedAt: null,
            createdAt: {
              gte: COMPANY_START,
            },
          },
        ],
      },
      select: {
        total: true,
      },
    }),

    prisma.backOfficeExpense.aggregate({
      where: {
        expenseDate: {
          gte: COMPANY_START,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const recordedSales = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  const recordedExpenses = Number(
    expenseResult._sum.amount ?? 0
  );

  const recordedNet =
    recordedSales - recordedExpenses;

  const expectedFunds =
    ASCEND_STARTUP_CAPITAL + recordedNet;

  const actualFunds =
    actualCash + actualBank;

  const variance =
    actualFunds - expectedFunds;

  await prisma.backOfficeReconciliation.create({
    data: {
      weekEnding: new Date(),

      actualCash,
      actualBank,
      actualFunds,

      recordedSales,
      recordedExpenses,
      recordedNet,

      openingFunds: ASCEND_STARTUP_CAPITAL,
      adjustments: 0,
      expectedFunds,

      variance,

      note: note || null,

      reconciledById: currentUser.id,
      reconciledByName:
        [currentUser.firstName, currentUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        currentUser.email ||
        null,
    },
  });

  revalidatePath("/backoffice/analytics");
}