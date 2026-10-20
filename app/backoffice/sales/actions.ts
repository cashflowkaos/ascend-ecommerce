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

export type VoidInvoiceInput = {
  invoiceId: string;
  reason: string;
};

export type VoidInvoiceResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function voidInvoice(
  input: VoidInvoiceInput
): Promise<VoidInvoiceResult> {
  const user = await requireAdmin();

  const invoiceId = input.invoiceId?.trim();
  const reason = input.reason?.trim();

  if (!invoiceId) {
    return {
      success: false,
      error: "Invoice ID is required.",
    };
  }

  if (!reason) {
    return {
      success: false,
      error: "A void reason is required.",
    };
  }

  const voidedByName =
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
              invoiceNumber: true,
              source: true,
              status: true,
              items: {
                select: {
                  productId: true,
                  productName: true,
                  product: {
                    select: {
                      inventoryType: true,
                    },
                  },
                  allocations: {
                    select: {
                      id: true,
                      batchId: true,
                      locationId: true,
                      quantity: true,
                    },
                  },
                  simpleAllocations: {
                    select: {
                      id: true,
                      productId: true,
                      locationId: true,
                      quantity: true,
                    },
                  },
                },
              },
            },
          });

        if (!invoice) {
          throw new Error("Invoice not found.");
        }

        if (invoice.status === "VOID") {
          throw new Error(
            "This invoice has already been voided."
          );
        }

        const allocations = invoice.items.flatMap((item) =>
          item.allocations.map((allocation) => ({
            ...allocation,
            productName: item.productName,
          }))
        );

        const simpleAllocations =
          invoice.items.flatMap((item) =>
            item.simpleAllocations.map((allocation) => ({
              ...allocation,
              productName: item.productName,
            }))
          );

        if (
          (invoice.source === "POS" ||
            invoice.source === "WEBSITE") &&
          invoice.status === "COMPLETED"
        ) {
          for (const item of invoice.items) {
            if (!item.productId || !item.product) {
              continue;
            }

            if (
              item.product.inventoryType === "BATCHED" &&
              item.allocations.length === 0
            ) {
              throw new Error(
                `${item.productName} has no batch inventory allocation and this invoice cannot be safely voided.`
              );
            }

            if (
              item.product.inventoryType === "SIMPLE" &&
              item.simpleAllocations.length === 0
            ) {
              throw new Error(
                `${item.productName} has no simple inventory allocation and this invoice cannot be safely voided.`
              );
            }
          }

          for (const allocation of allocations) {
            const balance =
              await tx.backOfficeInventoryBalance.findUnique({
                where: {
                  batchId_locationId: {
                    batchId: allocation.batchId,
                    locationId: allocation.locationId,
                  },
                },
                select: {
                  id: true,
                  quantity: true,
                },
              });

            const quantityBefore =
              balance?.quantity ?? 0;

            const quantityAfter =
              quantityBefore + allocation.quantity;

            if (balance) {
              const updated =
                await tx.backOfficeInventoryBalance.updateMany({
                  where: {
                    id: balance.id,
                    quantity: quantityBefore,
                  },
                  data: {
                    quantity: quantityAfter,
                  },
                });

              if (updated.count !== 1) {
                throw new Error(
                  "Inventory changed while voiding this invoice. Please try again."
                );
              }
            } else {
              await tx.backOfficeInventoryBalance.create({
                data: {
                  batchId: allocation.batchId,
                  locationId: allocation.locationId,
                  quantity: quantityAfter,
                },
              });
            }

            await tx.backOfficeInventoryMovement.create({
              data: {
                batchId: allocation.batchId,
                locationId: allocation.locationId,
                type: "RETURNED",
                quantityDelta: allocation.quantity,
                quantityBefore,
                quantityAfter,
                referenceType: "BACKOFFICE_INVOICE_VOID",
                referenceId: invoice.id,
                note: `Void ${invoice.invoiceNumber} - ${allocation.productName}`,
                createdById: user.id,
                createdByName: voidedByName,
              },
            });
          }

          for (const allocation of simpleAllocations) {
            const balance =
              await tx.backOfficeSimpleInventoryBalance.findUnique({
                where: {
                  productId_locationId: {
                    productId: allocation.productId,
                    locationId: allocation.locationId,
                  },
                },
                select: {
                  id: true,
                  quantity: true,
                },
              });

            const quantityBefore =
              balance?.quantity ?? 0;

            const quantityAfter =
              quantityBefore + allocation.quantity;

            if (balance) {
              const updated =
                await tx.backOfficeSimpleInventoryBalance.updateMany({
                  where: {
                    id: balance.id,
                    quantity: quantityBefore,
                  },
                  data: {
                    quantity: quantityAfter,
                  },
                });

              if (updated.count !== 1) {
                throw new Error(
                  "Simple inventory changed while voiding this invoice. Please try again."
                );
              }
            } else {
              await tx.backOfficeSimpleInventoryBalance.create({
                data: {
                  productId: allocation.productId,
                  locationId: allocation.locationId,
                  quantity: quantityAfter,
                },
              });
            }

            await tx.backOfficeSimpleInventoryMovement.create({
              data: {
                productId: allocation.productId,
                locationId: allocation.locationId,
                type: "RETURNED",
                quantityDelta: allocation.quantity,
                quantityBefore,
                quantityAfter,
                referenceType: "BACKOFFICE_INVOICE_VOID",
                referenceId: invoice.id,
                note: `Void ${invoice.invoiceNumber} - ${allocation.productName}`,
                createdById: user.id,
                createdByName: voidedByName,
              },
            });
          }
        }
        const updatedInvoice =
          await tx.backOfficeInvoice.updateMany({
            where: {
              id: invoice.id,
              status: invoice.status,
            },
            data: {
              status: "VOID",
              voidedAt: new Date(),
              voidedById: user.id,
              voidedByName,
              voidReason: reason,
            },
          });

        if (updatedInvoice.count !== 1) {
          throw new Error(
            "Invoice status changed while voiding. Please try again."
          );
        }
      },
      {
        isolationLevel: "Serializable",
      }
    );

    revalidatePath("/backoffice/sales");
    revalidatePath(`/backoffice/sales/${invoiceId}`);
    revalidatePath("/backoffice/pos");
    revalidatePath("/backoffice/inventory");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Invoice void failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to void invoice.",
    };
  }
}
export type CompleteLegacyInvoiceResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function completeLegacyInvoice(
  invoiceIdInput: string
): Promise<CompleteLegacyInvoiceResult> {
  await requireAdmin();

  const invoiceId = invoiceIdInput?.trim();

  if (!invoiceId) {
    return {
      success: false,
      error: "Invoice ID is required.",
    };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.backOfficeInvoice.findUnique({
          where: {
            id: invoiceId,
          },
          select: {
            id: true,
            source: true,
            status: true,
            total: true,
            amountPaid: true,
            balanceDue: true,
          },
        });

        if (!invoice) {
          throw new Error("Invoice not found.");
        }

        if (invoice.source !== "LEGACY_IMPORT") {
          throw new Error(
            "Only legacy import invoices can be completed with this action."
          );
        }

        if (invoice.status !== "OPEN") {
          throw new Error(
            "Only open legacy invoices can be marked completed."
          );
        }

        const total = roundMoney(Number(invoice.total));
        const amountPaid = roundMoney(Number(invoice.amountPaid));
        const balanceDue = roundMoney(Number(invoice.balanceDue));

        if (balanceDue !== 0 || amountPaid < total) {
          throw new Error(
            "This legacy invoice must be fully paid before it can be completed."
          );
        }

        const updated = await tx.backOfficeInvoice.updateMany({
          where: {
            id: invoice.id,
            source: "LEGACY_IMPORT",
            status: "OPEN",
          },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        if (updated.count !== 1) {
          throw new Error(
            "Invoice status changed while completing it. Please try again."
          );
        }
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
    console.error("Legacy invoice completion failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete legacy invoice.",
    };
  }
}