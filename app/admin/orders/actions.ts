"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function markOrderPaid(
  formData: FormData
) {
  const orderId = String(
    formData.get("orderId") ?? ""
  ).trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                productId: true,
                strength: true,
                inventoryQty: true,
              },
            },

            product: {
              select: {
                id: true,
                name: true,
                trackInventory: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    // ----------------------------------------------------------
    // DOUBLE-DEDUCTION PROTECTION
    // ----------------------------------------------------------

    if (order.paymentStatus === "PAID") {
      throw new Error(
        `Order ${order.orderNumber} is already paid.`
      );
    }

    if (order.status === "CANCELLED") {
      throw new Error(
        "A cancelled order cannot be marked paid."
      );
    }

    // ----------------------------------------------------------
    // VALIDATE ALL INVENTORY BEFORE CHANGING ANYTHING
    // ----------------------------------------------------------

    for (const item of order.items) {
      if (!item.product?.trackInventory) {
        continue;
      }

      if (!item.variantId || !item.variant) {
        throw new Error(
          `${item.productName} ${item.strength} does not have a valid inventory variant.`
        );
      }

      if (item.variant.inventoryQty < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${item.productName} ${item.strength}. ` +
          `Requested ${item.quantity}, available ${item.variant.inventoryQty}.`
        );
      }
    }

    // ----------------------------------------------------------
    // DEDUCT VARIANT INVENTORY + CREATE SOLD LEDGER RECORDS
    // ----------------------------------------------------------

    for (const item of order.items) {
      if (!item.product?.trackInventory) {
        continue;
      }

      if (!item.variantId || !item.variant) {
        throw new Error(
          "Variant inventory validation failed."
        );
      }

      const quantityBefore =
        item.variant.inventoryQty;

      const quantityAfter =
        quantityBefore - item.quantity;

      // Conditional update protects against concurrent orders
      // consuming the same stock between validation and update.

      const updated =
        await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            inventoryQty: {
              gte: item.quantity,
            },
          },

          data: {
            inventoryQty: {
              decrement: item.quantity,
            },
          },
        });

      if (updated.count !== 1) {
        throw new Error(
          `Inventory changed while processing ${item.productName} ${item.strength}. Please try again.`
        );
      }

      await tx.inventoryMovement.create({
        data: {
          productId: item.variant.productId,
          variantId: item.variantId,
          type: "SOLD",

          quantity: -item.quantity,
          quantityBefore,
          quantityAfter,

          note:
            `Order ${order.orderNumber} marked paid`,
        },
      });
    }

    // ----------------------------------------------------------
    // MARK ORDER PAID
    // ----------------------------------------------------------

    const paymentUpdate =
      await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: {
            not: "PAID",
          },
          status: {
            not: "CANCELLED",
          },
        },

        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

    if (paymentUpdate.count !== 1) {
      throw new Error(
        "Order payment status changed while processing. No inventory changes were committed."
      );
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/compounds");
}