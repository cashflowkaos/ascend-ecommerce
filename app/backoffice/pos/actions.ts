"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
function createInvoiceNumber() {
  const date = new Date();

  const year = date
    .getFullYear()
    .toString()
    .slice(-2);

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const suffix = randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `INV-${year}${month}${day}-${suffix}`;
}
type PosSellUnit = "UNIT" | "KIT";
type PosPaymentMethod = "CASH" | "ZELLE";

export type CompletePosSaleInput = {
  customerId: string;
  locationId: string;
  websiteOrderId?: string | null;

  items: {
    productId: string;
    sellUnit: PosSellUnit;
    quantity: number;
    unitPrice: number;
    priceAdjustmentReason?: string | null;
  }[];

  discountPercent?: number | null;
  discountAmount?: number | null;

  payment?: {
    method: PosPaymentMethod;
    amount: number;
    zelleReference?: string | null;
  } | null;
};

export type CompletePosSaleResult =
  | {
      success: true;
      invoiceId: string;
      invoiceNumber: string;
    }
  | {
      success: false;
      error: string;
    };
function isNonNegativeMoney(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateCompletePosSaleInput(
  input: CompletePosSaleInput
): string | null {
  if (!input.customerId?.trim()) {
    return "A customer is required.";
  }

  if (!input.locationId?.trim()) {
    return "An inventory location is required.";
  }

  if (
    input.websiteOrderId !== undefined &&
    input.websiteOrderId !== null &&
    !input.websiteOrderId.trim()
  ) {
    return "Invalid website order.";
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return "At least one item is required.";
  }

  for (const item of input.items) {
    if (!item.productId?.trim()) {
      return "Every item must have a product.";
    }

    if (item.sellUnit !== "UNIT" && item.sellUnit !== "KIT") {
      return "Invalid selling unit.";
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return "Item quantities must be positive whole numbers.";
    }

    if (!isNonNegativeMoney(item.unitPrice)) {
      return "Item prices must be valid non-negative amounts.";
    }

    if (
      item.priceAdjustmentReason !== undefined &&
      item.priceAdjustmentReason !== null &&
      typeof item.priceAdjustmentReason !== "string"
    ) {
      return "Invalid price adjustment reason.";
    }
  }

  const discountPercent = input.discountPercent ?? 0;
  const discountAmount = input.discountAmount ?? 0;

  if (
    !isNonNegativeMoney(discountPercent) ||
    discountPercent > 100
  ) {
    return "Discount percent must be between 0 and 100.";
  }

  if (!isNonNegativeMoney(discountAmount)) {
    return "Discount amount must be a valid non-negative amount.";
  }

  if (discountPercent > 0 && discountAmount > 0) {
    return "Use either a percentage discount or a dollar discount, not both.";
  }

  if (input.payment) {
    if (
      input.payment.method !== "CASH" &&
      input.payment.method !== "ZELLE"
    ) {
      return "Invalid payment method.";
    }

    if (!isNonNegativeMoney(input.payment.amount)) {
      return "Payment amount must be a valid non-negative amount.";
    }
  }

  return null;
}

type ServerPricingType =
  | "RETAIL"
  | "WHOLESALE"
  | "TIER_1"
  | "TIER_2"
  | "TIER_3";

type PosPricingProduct = {
  cost: number | null;
  retailPrice: number | null;
  unitsPerKit: number;
};

function getServerStandardPrice(
  product: PosPricingProduct,
  pricingType: ServerPricingType,
  sellUnit: PosSellUnit
) {
  const wholesalePrice =
    product.retailPrice === null
      ? null
      : product.retailPrice * 0.8;

  if (sellUnit === "UNIT") {
    return pricingType === "RETAIL"
      ? product.retailPrice
      : wholesalePrice;
  }

  if (pricingType === "TIER_1") {
    return product.cost === null
      ? null
      : Math.ceil(product.cost * 1.4);
  }

  if (pricingType === "TIER_2") {
    return product.cost === null
      ? null
      : Math.ceil(product.cost * 1.35);
  }

  if (pricingType === "TIER_3") {
    return product.cost === null
      ? null
      : Math.ceil(product.cost * 1.3);
  }

  const perUnitPrice =
    pricingType === "RETAIL"
      ? product.retailPrice
      : wholesalePrice;

  if (perUnitPrice === null) {
    return null;
  }

  return perUnitPrice * product.unitsPerKit;
}

async function allocateInventoryFifo(
  tx: Parameters<
    Parameters<typeof prisma.$transaction>[0]
  >[0],
  {
    productId,
    productName,
    locationId,
    locationName,
    quantityRequired,
    invoiceItemId,
    invoiceId,
    createdById,
    createdByName,
  }: {
    productId: string;
    productName: string;
    locationId: string;
    locationName: string;
    quantityRequired: number;
    invoiceItemId: string;
    invoiceId: string;
    createdById: string;
    createdByName: string;
  }
) {
  const batches = await tx.backOfficeBatch.findMany({
    where: {
      productId,
      status: "ACTIVE",
      balances: {
        some: {
          locationId,
          quantity: { gt: 0 },
        },
      },
    },
    orderBy: [
      { receivedAt: "asc" },
      { createdAt: "asc" },
    ],
    select: {
      id: true,
      batchNumber: true,
      balances: {
        where: {
          locationId,
          quantity: { gt: 0 },
        },
        select: {
          id: true,
          quantity: true,
        },
      },
    },
  });

  let remaining = quantityRequired;

  for (const batch of batches) {
    if (remaining <= 0) {
      break;
    }

    const balance = batch.balances[0];

    if (!balance || balance.quantity <= 0) {
      continue;
    }

    const quantityTaken = Math.min(
      remaining,
      balance.quantity
    );

    const quantityBefore = balance.quantity;
    const quantityAfter =
      quantityBefore - quantityTaken;

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
        `Inventory changed while selling ${productName}. Please try the sale again.`
      );
    }

    await tx.backOfficeInvoiceItemAllocation.create({
      data: {
        invoiceItemId,
        batchId: batch.id,
        locationId,
        quantity: quantityTaken,
      },
    });

    await tx.backOfficeInventoryMovement.create({
      data: {
        batchId: batch.id,
        locationId,
        type: "SOLD",
        quantityDelta: -quantityTaken,
        quantityBefore,
        quantityAfter,
        referenceType: "BACKOFFICE_INVOICE",
        referenceId: invoiceId,
        note: `POS sale - ${productName}`,
        createdById,
        createdByName,
      },
    });

    remaining -= quantityTaken;
  }

  if (remaining > 0) {
    throw new Error(
      `${productName} does not have enough physical inventory at ${locationName}.`
    );
  }
}
export async function completePosSale(
  input: CompletePosSaleInput
): Promise<CompletePosSaleResult> {
  const user = await requireAdmin();

  const validationError =
    validateCompletePosSaleInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const createdByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const [customer, location] = await Promise.all([
          tx.backOfficeCustomer.findUnique({
            where: { id: input.customerId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
              email: true,
              phone: true,
              pricingType: true,
              active: true,
            },
          }),
          tx.backOfficeLocation.findUnique({
            where: { id: input.locationId },
            select: {
              id: true,
              code: true,
              name: true,
              active: true,
            },
          }),
        ]);

        if (!customer || !customer.active) {
          throw new Error(
            "Customer not found or inactive."
          );
        }

        if (!location || !location.active) {
          throw new Error(
            "Inventory location not found or inactive."
          );
        }

        const websiteOrder = input.websiteOrderId
          ? await tx.order.findUnique({
              where: { id: input.websiteOrderId },
              select: {
                id: true,
                orderNumber: true,
                userId: true,
                status: true,
                fulfillmentMethod: true,
                shippingAmount: true,
                items: {
                  orderBy: { createdAt: "asc" },
                  select: {
                    id: true,
                    productId: true,
                    variantId: true,
                    productName: true,
                    sku: true,
                    strength: true,
                    quantity: true,
                    unitPrice: true,
                    lineTotal: true,
                    variant: {
                      select: {
                        backOfficeProductId: true,
                      },
                    },
                  },
                },
                backOfficeInvoice: {
                  select: {
                    id: true,
                    invoiceNumber: true,
                  },
                },
              },
            })
          : null;

        if (input.websiteOrderId && !websiteOrder) {
          throw new Error("Website order not found.");
        }

        if (websiteOrder?.status === "CANCELLED") {
          throw new Error("Cancelled website orders cannot be completed in POS.");
        }

        if (websiteOrder?.backOfficeInvoice) {
          throw new Error(
            `Website order ${websiteOrder.orderNumber} is already linked to invoice ${websiteOrder.backOfficeInvoice.invoiceNumber}.`
          );
        }

        if (websiteOrder) {
          const linkedCustomer =
            await tx.backOfficeCustomer.findUnique({
              where: { userId: websiteOrder.userId },
              select: { id: true },
            });

          if (!linkedCustomer || linkedCustomer.id !== customer.id) {
            throw new Error(
              `Website order ${websiteOrder.orderNumber} does not match the selected Back Office customer.`
            );
          }
        }

        const websiteDistroSkus = websiteOrder
          ? [
              ...new Set(
                websiteOrder.items
                  .filter(
                    (item) =>
                      item.variantId === null &&
                      item.productId === null &&
                      item.strength === "Distro" &&
                      Boolean(item.sku)
                  )
                  .map((item) => item.sku as string)
              ),
            ]
          : [];

        const websiteDistroProducts =
          websiteDistroSkus.length > 0
            ? await tx.distroProduct.findMany({
                where: {
                  sku: { in: websiteDistroSkus },
                },
                select: {
                  sku: true,
                  backOfficeProductId: true,
                },
              })
            : [];

        const websiteDistroProductMap = new Map(
          websiteDistroProducts.map((product) => [
            product.sku,
            product.backOfficeProductId,
          ])
        );

        const websitePriceItems = websiteOrder
          ? websiteOrder.items.flatMap((item) => {
              const isDistro =
                item.variantId === null &&
                item.productId === null &&
                item.strength === "Distro";

              const productId = isDistro
                ? item.sku
                  ? websiteDistroProductMap.get(item.sku) ?? null
                  : null
                : item.variant?.backOfficeProductId ?? null;

              if (!productId) {
                return [];
              }

              return [
                {
                  productId,
                  sellUnit: isDistro
                    ? ("KIT" as const)
                    : ("UNIT" as const),
                  unitPrice: roundMoney(Number(item.unitPrice)),
                },
              ];
            })
          : [];
        const productIds = [
          ...new Set(
            input.items.map((item) => item.productId)
          ),
        ];

        const products =
          await tx.backOfficeProduct.findMany({
            where: {
              id: { in: productIds },
              active: true,
            },
            select: {
              id: true,
              sku: true,
              name: true,
              cost: true,
              retailPrice: true,
              unitsPerKit: true,
            },
          });

        if (products.length !== productIds.length) {
          throw new Error(
            "One or more products are missing or inactive."
          );
        }

        const productMap = new Map(
          products.map((product) => [
            product.id,
            product,
          ])
        );

        const preparedItems = input.items.map((item) => {
          const product = productMap.get(item.productId);

          if (!product) {
            throw new Error("Product not found.");
          }

          const pricingProduct: PosPricingProduct = {
            cost:
              product.cost === null
                ? null
                : Number(product.cost),
            retailPrice:
              product.retailPrice === null
                ? null
                : Number(product.retailPrice),
            unitsPerKit: product.unitsPerKit,
          };

          const standardPrice =
            getServerStandardPrice(
              pricingProduct,
              customer.pricingType,
              item.sellUnit
            );

          const websiteExpectedItem = websitePriceItems.find(
            (expected) =>
              expected.productId === item.productId &&
              expected.sellUnit === item.sellUnit
          );

          if (!websiteExpectedItem && standardPrice === null) {
            throw new Error(
              `${product.name} does not have enough pricing information for this sale.`
            );
          }

          const standardUnitPrice = websiteExpectedItem
            ? websiteExpectedItem.unitPrice
            : roundMoney(standardPrice as number);

          const unitPrice = roundMoney(item.unitPrice);

          const priceAdjusted =
            unitPrice !== standardUnitPrice;

          const adjustmentReason =
            item.priceAdjustmentReason?.trim() || null;

          if (priceAdjusted && !adjustmentReason) {
            throw new Error(
              `A price adjustment reason is required for ${product.name}.`
            );
          }

          const unitsPerSellUnit =
            item.sellUnit === "KIT"
              ? product.unitsPerKit
              : 1;

          if (
            !Number.isInteger(unitsPerSellUnit) ||
            unitsPerSellUnit <= 0
          ) {
            throw new Error(
              `${product.name} has an invalid units-per-kit configuration.`
            );
          }

          const baseUnitsTotal =
            item.quantity * unitsPerSellUnit;

          const lineTotal = roundMoney(
            unitPrice * item.quantity
          );

          return {
            product,
            sellUnit: item.sellUnit,
            quantity: item.quantity,
            unitsPerSellUnit,
            baseUnitsTotal,
            standardUnitPrice,
            unitPrice,
            lineTotal,
            priceAdjusted,
            adjustmentReason,
          };
        });

        const requiredByProduct = new Map<
          string,
          number
        >();

        for (const item of preparedItems) {
          requiredByProduct.set(
            item.product.id,
            (requiredByProduct.get(item.product.id) ?? 0) +
              item.baseUnitsTotal
          );
        }

        for (const [productId, requiredQuantity] of
          requiredByProduct) {
          const product = productMap.get(productId);

          if (!product) {
            throw new Error("Product not found.");
          }

          const balances =
            await tx.backOfficeInventoryBalance.findMany({
              where: {
                locationId: location.id,
                quantity: { gt: 0 },
                batch: {
                  productId,
                  status: "ACTIVE",
                },
              },
              select: {
                quantity: true,
              },
            });

          const availableQuantity = balances.reduce(
            (sum, balance) => sum + balance.quantity,
            0
          );

          if (availableQuantity < requiredQuantity) {
            throw new Error(
              `${product.name} only has ${availableQuantity} physical units available at ${location.name}; ${requiredQuantity} are required.`
            );
          }
        }

        const shippingAmount =
          websiteOrder?.fulfillmentMethod === "SHIPPING"
            ? 20
            : 0;

        const subtotal = roundMoney(
          preparedItems.reduce(
            (sum, item) => sum + item.lineTotal,
            0
          ) + shippingAmount
        );

        const requestedDiscountPercent =
          input.discountPercent ?? 0;

        const requestedDiscountAmount =
          input.discountAmount ?? 0;

        const discountPercent =
          requestedDiscountPercent > 0
            ? roundMoney(requestedDiscountPercent)
            : null;

        const calculatedDiscount =
          discountPercent !== null
            ? roundMoney(
                subtotal * (discountPercent / 100)
              )
            : roundMoney(requestedDiscountAmount);

        const discountAmount = Math.min(
          subtotal,
          calculatedDiscount
        );

        const taxAmount = 0;

        const total = roundMoney(
          subtotal - discountAmount + taxAmount
        );

        const paymentAmount = roundMoney(
          input.payment?.amount ?? 0
        );

        if (paymentAmount > total) {
          throw new Error(
            "Payment cannot exceed the sale total."
          );
        }

        const amountPaid = paymentAmount;
        const balanceDue = roundMoney(
          total - amountPaid
        );

        const invoiceNumber = createInvoiceNumber();

        const invoice =
          await tx.backOfficeInvoice.create({
            data: {
              invoiceNumber,
              source: websiteOrder ? "WEBSITE" : "POS",
              websiteOrderId: websiteOrder?.id ?? null,
              status: "COMPLETED",

              customerId: customer.id,
              customerFirstName: customer.firstName,
              customerLastName: customer.lastName,
              customerCompany: customer.company,
              customerEmail: customer.email,
              customerPhone: customer.phone,
              pricingType: customer.pricingType,

              locationId: location.id,
              locationCode: location.code,
              locationName: location.name,

              subtotal,
              discountPercent,
              discountAmount,
              taxAmount,
              total,
              amountPaid,
              balanceDue,

              createdById: user.id,
              createdByName,
              completedAt: new Date(),
            },
            select: {
              id: true,
              invoiceNumber: true,
            },
          });


        for (const item of preparedItems) {
          const invoiceItem =
            await tx.backOfficeInvoiceItem.create({
              data: {
                invoiceId: invoice.id,
                productId: item.product.id,
                sku: item.product.sku,
                productName: item.product.name,
                sellUnit: item.sellUnit,
                quantity: item.quantity,
                unitsPerSellUnit:
                  item.unitsPerSellUnit,
                baseUnitsTotal:
                  item.baseUnitsTotal,
                standardUnitPrice:
                  item.standardUnitPrice,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
                priceAdjusted:
                  item.priceAdjusted,
                priceAdjustmentReason:
                  item.adjustmentReason,
              },
              select: {
                id: true,
              },
            });

          await allocateInventoryFifo(
            tx,
            {
              productId: item.product.id,
              productName: item.product.name,
              locationId: location.id,
              locationName: location.name,
              quantityRequired:
                item.baseUnitsTotal,
              invoiceItemId: invoiceItem.id,
              invoiceId: invoice.id,
              createdById: user.id,
              createdByName,
            }
          );
        }

        if (shippingAmount > 0) {
          await tx.backOfficeInvoiceItem.create({
            data: {
              invoiceId: invoice.id,
              productId: null,
              sku: "SHIPPING",
              productName: "Shipping",
              sellUnit: "UNIT",
              quantity: 1,
              unitsPerSellUnit: 0,
              baseUnitsTotal: 0,
              standardUnitPrice: shippingAmount,
              unitPrice: shippingAmount,
              lineTotal: shippingAmount,
              priceAdjusted: false,
              priceAdjustmentReason: null,
            },
          });
        }

        if (
          input.payment &&
          paymentAmount > 0
        ) {
          await tx.backOfficeInvoicePayment.create({
            data: {
              invoiceId: invoice.id,
              type: "PAYMENT",
              method: input.payment.method,
              amount: paymentAmount,
              zelleReference:
                input.payment.method === "ZELLE"
                  ? input.payment.zelleReference?.trim() ||
                    null
                  : null,
              receivedById: user.id,
              receivedByName: createdByName,
            },
          });
        }

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    revalidatePath("/backoffice/pos");
    revalidatePath("/backoffice/inventory");

    return {
      success: true,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
    };
  } catch (error) {
    console.error("POS sale failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete the sale.",
    };
  }
}
