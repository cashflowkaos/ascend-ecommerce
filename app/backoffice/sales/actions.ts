"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type InvoicePaymentMethod = "CASH" | "ZELLE";

export type AddInvoicePaymentInput = {
  invoiceId: string;
  method: InvoicePaymentMethod;
  amount: number;
  zelleReference?: string | null;
  note?: string | null;
};

export type AddInvoicePaymentResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function addInvoicePayment(
  input: AddInvoicePaymentInput
): Promise<AddInvoicePaymentResult> {
  const user = await requireAdmin();

  const invoiceId = input.invoiceId?.trim();
  const amount = roundMoney(input.amount);

  if (!invoiceId) {
    return {
      success: false,
      error: "Invoice ID is required.",
    };
  }

  if (
    input.method !== "CASH" &&
    input.method !== "ZELLE"
  ) {
    return {
      success: false,
      error: "Invalid payment method.",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      error: "Payment amount must be greater than zero.",
    };
  }

  const receivedByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  try {
    await prisma.$transaction(
      async (tx) => {
        const invoice =
          await tx.backOfficeInvoice.findUnique({
            where: {
              id: invoiceId,
            },
            select: {
              id: true,
              status: true,
              total: true,
              amountPaid: true,
              balanceDue: true,
            },
          });

        if (!invoice) {
          throw new Error("Invoice not found.");
        }

        if (invoice.status === "VOID") {
          throw new Error(
            "Payments cannot be added to a void invoice."
          );
        }

        const currentAmountPaid = roundMoney(
          Number(invoice.amountPaid)
        );

        const currentBalanceDue = roundMoney(
          Number(invoice.balanceDue)
        );

        if (currentBalanceDue <= 0) {
          throw new Error(
            "This invoice does not have a balance due."
          );
        }

        if (amount > currentBalanceDue) {
          throw new Error(
            `Payment cannot exceed the remaining balance of $${currentBalanceDue.toFixed(
              2
            )}.`
          );
        }

        const newAmountPaid = roundMoney(
          currentAmountPaid + amount
        );

        const newBalanceDue = roundMoney(
          Number(invoice.total) - newAmountPaid
        );

        const updated =
          await tx.backOfficeInvoice.updateMany({
            where: {
              id: invoice.id,
              amountPaid: invoice.amountPaid,
              balanceDue: invoice.balanceDue,
              status: invoice.status,
            },
            data: {
              amountPaid: newAmountPaid,
              balanceDue: newBalanceDue,
            },
          });

        if (updated.count !== 1) {
          throw new Error(
            "Invoice balance changed while recording the payment. Please try again."
          );
        }

        await tx.backOfficeInvoicePayment.create({
          data: {
            invoiceId: invoice.id,
            type: "PAYMENT",
            method: input.method,
            amount,
            zelleReference:
              input.method === "ZELLE"
                ? input.zelleReference?.trim() || null
                : null,
            note: input.note?.trim() || null,
            receivedById: user.id,
            receivedByName,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    revalidatePath("/backoffice/sales");
    revalidatePath(`/backoffice/sales/${invoiceId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Invoice payment failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to record payment.",
    };
  }
}
