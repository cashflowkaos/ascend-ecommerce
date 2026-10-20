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
