"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_STATUSES = new Set(["DRAFT", "ORDERED", "SHIPPED"]);
const ALLOWED_PURCHASE_UNITS = new Set(["UNIT", "KIT"]);

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseDate(
  value: FormDataEntryValue | null,
  label: string,
  required = false
) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    if (required) {
      throw new Error(`${label} is required.`);
    }

    return null;
  }

  const date = new Date(`${raw}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label.toLowerCase()}.`);
  }

  return date;
}

function parseNonNegativeMoney(
  value: FormDataEntryValue | null,
  label: string
) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return 0;
  }

  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }

  return amount;
}

function generatePoNumber() {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
    String(now.getMilliseconds()).padStart(3, "0"),
  ].join("");

  return `PO-${datePart}-${timePart}`;
}

export async function createBackOfficePurchaseOrder(
  formData: FormData
) {
  await requireAdmin();

  const supplierId = String(
    formData.get("supplierId") ?? ""
  ).trim();

  if (!supplierId) {
    throw new Error("Supplier is required.");
  }

  const supplier = await prisma.backOfficeSupplier.findUnique({
    where: { id: supplierId },
    select: {
      id: true,
      active: true,
    },
  });

  if (!supplier) {
    throw new Error("Supplier not found.");
  }

  if (!supplier.active) {
    throw new Error("Inactive suppliers cannot be used for new purchase orders.");
  }

  const status = String(
    formData.get("status") ?? "ORDERED"
  ).trim();

  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid purchase order status.");
  }

  const orderDate = parseDate(
    formData.get("orderDate"),
    "Order date",
    true
  );

  if (!orderDate) {
    throw new Error("Order date is required.");
  }

  const expectedDate = parseDate(
    formData.get("expectedDate"),
    "Expected date"
  );

  const requestedPoNumber = String(
    formData.get("poNumber") ?? ""
  ).trim();

  const poNumber = requestedPoNumber || generatePoNumber();

  const duplicatePo = await prisma.backOfficePurchaseOrder.findUnique({
    where: { poNumber },
    select: { id: true },
  });

  if (duplicatePo) {
    throw new Error("That PO number already exists.");
  }

  const productIds = formData
    .getAll("productId")
    .map((value) => String(value).trim());

  const purchaseUnits = formData
    .getAll("purchaseUnit")
    .map((value) => String(value).trim());

  const quantities = formData
    .getAll("quantity")
    .map((value) => String(value).trim());

  const unitCosts = formData
    .getAll("unitCost")
    .map((value) => String(value).trim());

  if (productIds.length === 0) {
    throw new Error("At least one product is required.");
  }

  if (
    purchaseUnits.length !== productIds.length ||
    quantities.length !== productIds.length ||
    unitCosts.length !== productIds.length
  ) {
    throw new Error("Purchase order line data is incomplete.");
  }

  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.some((id) => !id)) {
    throw new Error("Every purchase order line requires a product.");
  }

  const products = await prisma.backOfficeProduct.findMany({
    where: {
      id: { in: uniqueProductIds },
      active: true,
    },
    select: {
      id: true,
      sku: true,
      name: true,
      inventoryType: true,
      unitsPerKit: true,
    },
  });

  const productMap = new Map(
    products.map((product) => [product.id, product])
  );

  const items = productIds.map((productId, index) => {
    const product = productMap.get(productId);

    if (!product) {
      throw new Error(
        "One or more selected products are unavailable."
      );
    }

    const purchaseUnit = purchaseUnits[index];

    if (!ALLOWED_PURCHASE_UNITS.has(purchaseUnit)) {
      throw new Error("Invalid purchase unit.");
    }

    if (
      purchaseUnit === "KIT" &&
      product.inventoryType !== "BATCHED"
    ) {
      throw new Error(
        `${product.name} cannot be purchased as a kit.`
      );
    }

    const quantity = Number(quantities[index]);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        `Quantity for ${product.name} must be a positive whole number.`
      );
    }

    const unitCost = Number(unitCosts[index]);

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      throw new Error(
        `Cost for ${product.name} must be zero or greater.`
      );
    }

    const lineTotal =
      Math.round(quantity * unitCost * 100) / 100;

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      inventoryType: product.inventoryType,
      unitsPerKit: product.unitsPerKit,
      purchaseUnit:
        purchaseUnit as "UNIT" | "KIT",
      quantityOrdered: quantity,
      unitCost,
      lineTotal,
    };
  });

  const subtotal =
    Math.round(
      items.reduce((sum, item) => sum + item.lineTotal, 0) *
        100
    ) / 100;

  const shipping = parseNonNegativeMoney(
    formData.get("shipping"),
    "Shipping"
  );

  const otherCosts = parseNonNegativeMoney(
    formData.get("otherCosts"),
    "Other costs"
  );

  const total =
    Math.round((subtotal + shipping + otherCosts) * 100) / 100;

  const purchaseOrder =
    await prisma.backOfficePurchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: status as "DRAFT" | "ORDERED" | "SHIPPED",
        orderDate,
        expectedDate,
        subtotal,
        shipping,
        otherCosts,
        total,
        supplierReference: optionalText(
          formData.get("supplierReference")
        ),
        trackingNumber: optionalText(
          formData.get("trackingNumber")
        ),
        notes: optionalText(formData.get("notes")),
        items: {
          create: items,
        },
      },
      select: {
        id: true,
      },
    });

  revalidatePath("/backoffice/purchasing");
  revalidatePath(`/backoffice/purchasing/${purchaseOrder.id}`);

  redirect(`/backoffice/purchasing/${purchaseOrder.id}`);
}

export async function receiveBackOfficePurchaseOrder(
  formData: FormData
) {
  const user = await requireAdmin();

  const purchaseOrderId = String(
    formData.get("purchaseOrderId") ?? ""
  ).trim();

  const locationId = String(
    formData.get("locationId") ?? ""
  ).trim();

  const note = optionalText(formData.get("receiptNote"));

  if (!purchaseOrderId || !locationId) {
    throw new Error(
      "Purchase order and receiving location are required."
    );
  }

  const itemIds = formData
    .getAll("purchaseOrderItemId")
    .map((value) => String(value).trim());

  const rawQuantities = formData.getAll("receiveQuantity");
  const batchNumbers = formData
    .getAll("batchNumber")
    .map((value) => String(value).trim());

  if (
    itemIds.length === 0 ||
    itemIds.length !== rawQuantities.length ||
    itemIds.length !== batchNumbers.length
  ) {
    throw new Error("Invalid receiving line data.");
  }

  const requestedLines = itemIds.map((itemId, index) => {
    const quantity = Number(rawQuantities[index]);

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      throw new Error(
        "Receiving quantities must be non-negative whole numbers."
      );
    }

    return {
      itemId,
      quantity,
      batchNumber: batchNumbers[index] ?? "",
    };
  });

  if (!requestedLines.some((line) => line.quantity > 0)) {
    throw new Error("Enter at least one quantity to receive.");
  }

  const createdByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  await prisma.$transaction(async (tx) => {
    const [purchaseOrder, location] = await Promise.all([
      tx.backOfficePurchaseOrder.findUnique({
        where: {
          id: purchaseOrderId,
        },
        include: {
          items: true,
        },
      }),

      tx.backOfficeLocation.findUnique({
        where: {
          id: locationId,
        },
        select: {
          id: true,
          active: true,
        },
      }),
    ]);

    if (!purchaseOrder) {
      throw new Error("Purchase order not found.");
    }

    if (
      purchaseOrder.status === "CANCELLED" ||
      purchaseOrder.status === "RECEIVED"
    ) {
      throw new Error(
        "This purchase order cannot receive additional inventory."
      );
    }

    if (!location || !location.active) {
      throw new Error(
        "Receiving location not found or inactive."
      );
    }

    const poItemsById = new Map(
      purchaseOrder.items.map((item) => [item.id, item])
    );

    const preparedLines = requestedLines
      .filter((line) => line.quantity > 0)
      .map((line) => {
        const item = poItemsById.get(line.itemId);

        if (!item) {
          throw new Error(
            "A receiving line does not belong to this purchase order."
          );
        }

        const orderedPhysical =
          item.inventoryType === "BATCHED" &&
          item.purchaseUnit === "KIT"
            ? item.quantityOrdered * item.unitsPerKit
            : item.quantityOrdered;

        const remainingPhysical =
          Math.max(
            0,
            orderedPhysical - item.quantityReceived
          );

        if (line.quantity > remainingPhysical) {
          throw new Error(
            `${item.productName}: receiving quantity exceeds the remaining quantity of ${remainingPhysical}.`
          );
        }

        if (
          item.inventoryType === "BATCHED" &&
          !line.batchNumber
        ) {
          throw new Error(
            `${item.productName}: batch / lot number is required.`
          );
        }

        const purchaseCost = Number(item.unitCost);

        const physicalUnitCost =
          item.inventoryType === "BATCHED" &&
          item.purchaseUnit === "KIT"
            ? purchaseCost / item.unitsPerKit
            : purchaseCost;

        return {
          item,
          quantity: line.quantity,
          batchNumber:
            item.inventoryType === "BATCHED"
              ? line.batchNumber
              : null,
          physicalUnitCost,
        };
      });

    const receipt =
      await tx.backOfficePurchaseReceipt.create({
        data: {
          purchaseOrderId,
          locationId,
          receivedAt: new Date(),
          note,
          receivedById: user.id,
          receivedByName: createdByName,
        },
        select: {
          id: true,
        },
      });

    for (const line of preparedLines) {
      const { item, quantity, physicalUnitCost } = line;

      let batchId: string | null = null;

      if (item.inventoryType === "BATCHED") {
        const batchNumber = line.batchNumber!;

        let batch = await tx.backOfficeBatch.findUnique({
          where: {
            productId_batchNumber: {
              productId: item.productId,
              batchNumber,
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (!batch) {
          batch = await tx.backOfficeBatch.create({
            data: {
              productId: item.productId,
              batchNumber,
              status: "ACTIVE",
              receivedAt: new Date(),
            },
            select: {
              id: true,
              status: true,
            },
          });
        } else if (batch.status !== "ACTIVE") {
          await tx.backOfficeBatch.update({
            where: {
              id: batch.id,
            },
            data: {
              status: "ACTIVE",
              retiredAt: null,
            },
          });
        }

        batchId = batch.id;

        const balance =
          await tx.backOfficeInventoryBalance.findUnique({
            where: {
              batchId_locationId: {
                batchId,
                locationId,
              },
            },
            select: {
              id: true,
              quantity: true,
            },
          });

        const quantityBefore = balance?.quantity ?? 0;
        const quantityAfter = quantityBefore + quantity;

        if (balance) {
          await tx.backOfficeInventoryBalance.update({
            where: {
              id: balance.id,
            },
            data: {
              quantity: quantityAfter,
            },
          });
        } else {
          await tx.backOfficeInventoryBalance.create({
            data: {
              batchId,
              locationId,
              quantity: quantityAfter,
            },
          });
        }

        await tx.backOfficeInventoryMovement.create({
          data: {
            batchId,
            locationId,
            type: "RECEIVED",
            quantityDelta: quantity,
            quantityBefore,
            quantityAfter,
            referenceType: "PURCHASE_RECEIPT",
            referenceId: receipt.id,
            note,
            createdById: user.id,
            createdByName,
          },
        });
      } else if (item.inventoryType === "SIMPLE") {
        const balance =
          await tx.backOfficeSimpleInventoryBalance.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId,
              },
            },
            select: {
              id: true,
              quantity: true,
            },
          });

        const quantityBefore = balance?.quantity ?? 0;
        const quantityAfter = quantityBefore + quantity;

        if (balance) {
          await tx.backOfficeSimpleInventoryBalance.update({
            where: {
              id: balance.id,
            },
            data: {
              quantity: quantityAfter,
            },
          });
        } else {
          await tx.backOfficeSimpleInventoryBalance.create({
            data: {
              productId: item.productId,
              locationId,
              quantity: quantityAfter,
            },
          });
        }

        await tx.backOfficeSimpleInventoryMovement.create({
          data: {
            productId: item.productId,
            locationId,
            type: "RECEIVED",
            quantityDelta: quantity,
            quantityBefore,
            quantityAfter,
            referenceType: "PURCHASE_RECEIPT",
            referenceId: receipt.id,
            note,
            createdById: user.id,
            createdByName,
          },
        });
      }

      await tx.backOfficePurchaseReceiptItem.create({
        data: {
          receiptId: receipt.id,
          purchaseOrderItemId: item.id,
          productId: item.productId,
          inventoryType: item.inventoryType,
          quantityReceived: quantity,
          batchId,
          batchNumber: line.batchNumber,
          physicalUnitCost,
        },
      });

      await tx.backOfficePurchaseOrderItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantityReceived: {
            increment: quantity,
          },
        },
      });
    }

    const updatedItems =
      await tx.backOfficePurchaseOrderItem.findMany({
        where: {
          purchaseOrderId,
        },
        select: {
          inventoryType: true,
          purchaseUnit: true,
          quantityOrdered: true,
          quantityReceived: true,
          unitsPerKit: true,
        },
      });

    const inventoryItems = updatedItems.filter(
      (item) => item.inventoryType !== "NON_INVENTORY"
    );

    const fullyReceived =
      inventoryItems.length > 0 &&
      inventoryItems.every((item) => {
        const orderedPhysical =
          item.inventoryType === "BATCHED" &&
          item.purchaseUnit === "KIT"
            ? item.quantityOrdered * item.unitsPerKit
            : item.quantityOrdered;

        return item.quantityReceived >= orderedPhysical;
      });

    const anythingReceived = updatedItems.some(
      (item) => item.quantityReceived > 0
    );

    await tx.backOfficePurchaseOrder.update({
      where: {
        id: purchaseOrderId,
      },
      data: {
        status: fullyReceived
          ? "RECEIVED"
          : anythingReceived
            ? "PARTIALLY_RECEIVED"
            : purchaseOrder.status,
        receivedDate: fullyReceived ? new Date() : null,
      },
    });
  });

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/inventory");
  revalidatePath("/backoffice/inventory/ledger");
  revalidatePath("/backoffice/purchasing");
  revalidatePath(`/backoffice/purchasing/${purchaseOrderId}`);
}
export async function voidBackOfficePurchaseReceipt(
  formData: FormData
) {
  const user = await requireAdmin();

  const receiptId = String(
    formData.get("receiptId") ?? ""
  ).trim();

  const voidReason = String(
    formData.get("voidReason") ?? ""
  ).trim();

  if (!receiptId) {
    throw new Error("Receipt is required.");
  }

  if (!voidReason) {
    throw new Error(
      "A reason is required to void a receipt."
    );
  }

  const voidedByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  const purchaseOrderId = await prisma.$transaction(
    async (tx) => {
      const receipt =
        await tx.backOfficePurchaseReceipt.findUnique({
          where: {
            id: receiptId,
          },
          include: {
            items: true,
          },
        });

      if (!receipt) {
        throw new Error("Purchase receipt not found.");
      }

      if (receipt.voidedAt) {
        throw new Error(
          "This purchase receipt has already been voided."
        );
      }

      for (const item of receipt.items) {
        if (item.inventoryType === "BATCHED") {
          if (!item.batchId) {
            throw new Error(
              "A batched receipt item is missing its batch reference."
            );
          }

          const balance =
            await tx.backOfficeInventoryBalance.findUnique({
              where: {
                batchId_locationId: {
                  batchId: item.batchId,
                  locationId: receipt.locationId,
                },
              },
              select: {
                id: true,
                quantity: true,
              },
            });

          const quantityBefore = balance?.quantity ?? 0;

          if (quantityBefore < item.quantityReceived) {
            throw new Error(
              "This receipt cannot be voided because some of its received inventory is no longer available at the receiving location."
            );
          }
        }

        if (item.inventoryType === "SIMPLE") {
          const balance =
            await tx.backOfficeSimpleInventoryBalance.findUnique({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: receipt.locationId,
                },
              },
              select: {
                id: true,
                quantity: true,
              },
            });

          const quantityBefore = balance?.quantity ?? 0;

          if (quantityBefore < item.quantityReceived) {
            throw new Error(
              "This receipt cannot be voided because some of its received inventory is no longer available at the receiving location."
            );
          }
        }
      }

      for (const item of receipt.items) {
        if (item.inventoryType === "BATCHED") {
          const balance =
            await tx.backOfficeInventoryBalance.findUniqueOrThrow({
              where: {
                batchId_locationId: {
                  batchId: item.batchId!,
                  locationId: receipt.locationId,
                },
              },
              select: {
                id: true,
                quantity: true,
              },
            });

          const quantityAfter =
            balance.quantity - item.quantityReceived;

          await tx.backOfficeInventoryBalance.update({
            where: {
              id: balance.id,
            },
            data: {
              quantity: quantityAfter,
            },
          });

          await tx.backOfficeInventoryMovement.create({
            data: {
              batchId: item.batchId!,
              locationId: receipt.locationId,
              type: "ADJUSTMENT",
              quantityDelta: -item.quantityReceived,
              quantityBefore: balance.quantity,
              quantityAfter,
              referenceType: "PURCHASE_RECEIPT_VOID",
              referenceId: receipt.id,
              note: voidReason,
              createdById: user.id,
              createdByName: voidedByName,
            },
          });
        } else if (item.inventoryType === "SIMPLE") {
          const balance =
            await tx.backOfficeSimpleInventoryBalance.findUniqueOrThrow({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: receipt.locationId,
                },
              },
              select: {
                id: true,
                quantity: true,
              },
            });

          const quantityAfter =
            balance.quantity - item.quantityReceived;

          await tx.backOfficeSimpleInventoryBalance.update({
            where: {
              id: balance.id,
            },
            data: {
              quantity: quantityAfter,
            },
          });

          await tx.backOfficeSimpleInventoryMovement.create({
            data: {
              productId: item.productId,
              locationId: receipt.locationId,
              type: "ADJUSTMENT",
              quantityDelta: -item.quantityReceived,
              quantityBefore: balance.quantity,
              quantityAfter,
              referenceType: "PURCHASE_RECEIPT_VOID",
              referenceId: receipt.id,
              note: voidReason,
              createdById: user.id,
              createdByName: voidedByName,
            },
          });
        }

        await tx.backOfficePurchaseOrderItem.update({
          where: {
            id: item.purchaseOrderItemId,
          },
          data: {
            quantityReceived: {
              decrement: item.quantityReceived,
            },
          },
        });
      }

      await tx.backOfficePurchaseReceipt.update({
        where: {
          id: receipt.id,
        },
        data: {
          voidedAt: new Date(),
          voidedById: user.id,
          voidedByName,
          voidReason,
        },
      });

      const updatedItems =
        await tx.backOfficePurchaseOrderItem.findMany({
          where: {
            purchaseOrderId: receipt.purchaseOrderId,
          },
          select: {
            inventoryType: true,
            purchaseUnit: true,
            quantityOrdered: true,
            quantityReceived: true,
            unitsPerKit: true,
          },
        });

      const inventoryItems = updatedItems.filter(
        (item) => item.inventoryType !== "NON_INVENTORY"
      );

      const fullyReceived =
        inventoryItems.length > 0 &&
        inventoryItems.every((item) => {
          const orderedPhysical =
            item.inventoryType === "BATCHED" &&
            item.purchaseUnit === "KIT"
              ? item.quantityOrdered * item.unitsPerKit
              : item.quantityOrdered;

          return item.quantityReceived >= orderedPhysical;
        });

      const anythingReceived = inventoryItems.some(
        (item) => item.quantityReceived > 0
      );

      await tx.backOfficePurchaseOrder.update({
        where: {
          id: receipt.purchaseOrderId,
        },
        data: {
          status: fullyReceived
            ? "RECEIVED"
            : anythingReceived
              ? "PARTIALLY_RECEIVED"
              : "ORDERED",
          receivedDate: fullyReceived ? new Date() : null,
        },
      });

      return receipt.purchaseOrderId;
    }
  );

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/inventory");
  revalidatePath("/backoffice/inventory/ledger");
  revalidatePath("/backoffice/purchasing");
  revalidatePath(
    `/backoffice/purchasing/${purchaseOrderId}`
  );
}

export async function recordBackOfficePurchasePayment(
  formData: FormData
) {
  const user = await requireAdmin();

  const purchaseOrderId = String(
    formData.get("purchaseOrderId") ?? ""
  ).trim();

  const amount = Number(formData.get("amount"));
  const paidAtRaw = String(formData.get("paidAt") ?? "").trim();
  const paidFrom = String(formData.get("paidFrom") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const note = String(formData.get("paymentNote") ?? "").trim();

  if (!purchaseOrderId) {
    throw new Error("Purchase order is required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!paidAtRaw) {
    throw new Error("Payment date is required.");
  }

  const paidAt = new Date(`${paidAtRaw}T12:00:00`);

  if (Number.isNaN(paidAt.getTime())) {
    throw new Error("Invalid payment date.");
  }

  if (!paidFrom) {
    throw new Error("Paid from is required.");
  }

  const createdByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  await prisma.$transaction(async (tx) => {
    const order = await tx.backOfficePurchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: {
        id: true,
        total: true,
        status: true,
        payments: {
          where: {
            voidedAt: null,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Purchase order not found.");
    }

    if (order.status === "CANCELLED") {
      throw new Error("A cancelled purchase order cannot be paid.");
    }

    const alreadyPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remaining = Number(order.total) - alreadyPaid;

    if (amount > remaining + 0.0001) {
      throw new Error(
        `Payment exceeds the remaining PO balance of $${remaining.toFixed(2)}.`
      );
    }

    await tx.backOfficePurchasePayment.create({
      data: {
        purchaseOrderId,
        amount,
        paidAt,
        paidFrom,
        reference: reference || null,
        note: note || null,
        createdById: user.id,
        createdByName,
      },
    });
  });

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/analytics");
  revalidatePath("/backoffice/purchasing");
  revalidatePath(`/backoffice/purchasing/${purchaseOrderId}`);
}

export async function voidBackOfficePurchasePayment(
  formData: FormData
) {
  const user = await requireAdmin();

  const paymentId = String(
    formData.get("paymentId") ?? ""
  ).trim();

  const voidReason = String(
    formData.get("voidReason") ?? ""
  ).trim();

  if (!paymentId) {
    throw new Error("Payment is required.");
  }

  if (!voidReason) {
    throw new Error("A reason is required to void a payment.");
  }

  const voidedByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  const purchaseOrderId = await prisma.$transaction(
    async (tx) => {
      const payment =
        await tx.backOfficePurchasePayment.findUnique({
          where: {
            id: paymentId,
          },
          select: {
            id: true,
            purchaseOrderId: true,
            voidedAt: true,
          },
        });

      if (!payment) {
        throw new Error("Purchase payment not found.");
      }

      if (payment.voidedAt) {
        throw new Error(
          "This purchase payment has already been voided."
        );
      }

      await tx.backOfficePurchasePayment.update({
        where: {
          id: payment.id,
        },
        data: {
          voidedAt: new Date(),
          voidedById: user.id,
          voidedByName,
          voidReason,
        },
      });

      return payment.purchaseOrderId;
    }
  );

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/analytics");
  revalidatePath("/backoffice/purchasing");
  revalidatePath(`/backoffice/purchasing/${purchaseOrderId}`);
}

export async function deleteBackOfficePurchaseOrder(
  formData: FormData
) {
  await requireAdmin();

  const purchaseOrderId = String(
    formData.get("purchaseOrderId") ?? ""
  ).trim();

  if (!purchaseOrderId) {
    throw new Error("Purchase order is required.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.backOfficePurchaseOrder.findUnique({
      where: {
        id: purchaseOrderId,
      },
      select: {
        id: true,
        poNumber: true,
        _count: {
          select: {
            receipts: true,
            payments: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Purchase order not found.");
    }

    if (order._count.receipts > 0) {
      throw new Error(
        "This purchase order has receipt history and cannot be permanently deleted."
      );
    }

    if (order._count.payments > 0) {
      throw new Error(
        "This purchase order has payment history and cannot be permanently deleted."
      );
    }

    await tx.backOfficePurchaseOrderItem.deleteMany({
      where: {
        purchaseOrderId: order.id,
      },
    });

    await tx.backOfficePurchaseOrder.delete({
      where: {
        id: order.id,
      },
    });
  });

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/analytics");
  revalidatePath("/backoffice/purchasing");

  redirect("/backoffice/purchasing");
}
