import "dotenv/config";
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const MIGRATION_PATH =
  "C:\\Users\\vinh\\Downloads\\ascend-migration-2026-10-11.json";

const APPLY = process.argv.includes("--apply");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type LegacyProduct = {
  id: number;
  itemCode?: string | null;
  name: string;
  unit?: string | null;
};

type LegacyItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type LegacySale = {
  id: number;
  customerId?: number | null;
  invoiceNumber: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: string;
  status: string;
  notes?: string | null;
  voidReason?: string | null;
  voidedAt?: string | null;
  items: LegacyItem[];
};

type MigrationData = {
  customers: Array<{ id: number }>;
  products: LegacyProduct[];
  sales: LegacySale[];
};

function money(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid money value: ${String(value)}`);
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
}

function mapStatus(status: string) {
  if (status === "Paid") return "COMPLETED" as const;
  if (status === "Outstanding") return "OPEN" as const;
  if (status === "VOID") return "VOID" as const;

  throw new Error(`Unsupported legacy status: ${status}`);
}

function legacyInternalNote(sale: LegacySale) {
  const parts: string[] = [];

  if (sale.notes?.trim()) {
    parts.push(sale.notes.trim());
  }

  parts.push(`Legacy payment method: ${sale.paymentMethod}`);

  if (
    sale.paymentMethod === "Imported" &&
    money(sale.amountPaid) > 0
  ) {
    parts.push(
      `Legacy paid amount preserved from source snapshot: $${money(
        sale.amountPaid
      ).toFixed(2)}`
    );
  }

  return parts.join("\n");
}

(async () => {
  try {
    console.log(
      APPLY
        ? "LEGACY SALES MIGRATION - APPLY MODE"
        : "LEGACY SALES MIGRATION - DRY RUN ONLY"
    );
    console.log("");

    if (!fs.existsSync(MIGRATION_PATH)) {
      throw new Error(`Migration file not found: ${MIGRATION_PATH}`);
    }

    const data = JSON.parse(
      fs.readFileSync(MIGRATION_PATH, "utf8")
    ) as MigrationData;

    const hub = await prisma.backOfficeLocation.findUnique({
      where: { code: "HUB" },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
      },
    });

    if (!hub || !hub.active) {
      throw new Error("Active HUB location was not found.");
    }

    const generalCustomers =
      await prisma.backOfficeCustomer.findMany({
        where: {
          firstName: "General",
          lastName: "Customer",
          active: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
          phone: true,
          pricingType: true,
        },
      });

    if (generalCustomers.length !== 1) {
      throw new Error(
        `Expected exactly 1 active General Customer; found ${generalCustomers.length}.`
      );
    }

    const generalCustomer = generalCustomers[0];

    const sourceCustomerIds = data.customers.map(
      (customer) => customer.id
    );

    const customers =
      await prisma.backOfficeCustomer.findMany({
        where: {
          legacyCustomerId: {
            in: sourceCustomerIds,
          },
        },
        select: {
          id: true,
          legacyCustomerId: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
          phone: true,
          pricingType: true,
        },
      });

    const customerMap = new Map(
      customers.map((customer) => [
        customer.legacyCustomerId,
        customer,
      ])
    );

    const productMap = new Map(
      data.products.map((product) => [
        product.id,
        product,
      ])
    );

    const invoiceNumbers = data.sales.map(
      (sale) => sale.invoiceNumber
    );

    const legacySaleIds = data.sales.map(
      (sale) => sale.id
    );

    const existingInvoices =
      await prisma.backOfficeInvoice.findMany({
        where: {
          OR: [
            {
              invoiceNumber: {
                in: invoiceNumbers,
              },
            },
            {
              legacySaleId: {
                in: legacySaleIds,
              },
            },
          ],
        },
        select: {
          invoiceNumber: true,
          legacySaleId: true,
        },
      });

    const errors: string[] = [];
    let itemCount = 0;
    let nullCustomerSales = 0;
    let paymentRows = 0;
    let importedPaymentSnapshots = 0;
    let openBalance = 0;

    const statusCounts = new Map<string, number>();

    for (const sale of data.sales) {
      const mappedStatus = mapStatus(sale.status);

      statusCounts.set(
        mappedStatus,
        (statusCounts.get(mappedStatus) ?? 0) + 1
      );

      const customer =
        sale.customerId == null
          ? generalCustomer
          : customerMap.get(sale.customerId);

      if (sale.customerId == null) {
        nullCustomerSales++;
      }

      if (!customer) {
        errors.push(
          `${sale.invoiceNumber}: customer ${sale.customerId} is not mapped`
        );
      }

      if (!sale.invoiceNumber?.trim()) {
        errors.push(`Sale ${sale.id}: blank invoice number`);
      }

      if (sale.status === "Outstanding") {
        openBalance += money(sale.balanceDue);
      }

      if (
        (sale.paymentMethod === "Cash" ||
          sale.paymentMethod === "Zelle") &&
        money(sale.amountPaid) > 0
      ) {
        paymentRows++;
      }

      if (
        sale.paymentMethod === "Imported" &&
        money(sale.amountPaid) > 0
      ) {
        importedPaymentSnapshots++;
      }

      for (const item of sale.items) {
        itemCount++;

        const product = productMap.get(item.productId);

        if (!product) {
          errors.push(
            `${sale.invoiceNumber}: product ${item.productId} is not mapped`
          );
          continue;
        }

        if (product.unit !== "vial") {
          errors.push(
            `${sale.invoiceNumber}: product ${item.productId} has unexpected unit ${product.unit}`
          );
        }

        const expectedLineTotal = money(
          Number(item.quantity) * money(item.unitPrice)
        );

        if (expectedLineTotal !== money(item.lineTotal)) {
          errors.push(
            `${sale.invoiceNumber}: line total mismatch for product ${item.productId}`
          );
        }
      }
    }

    console.log("Source invoices:", data.sales.length);
    console.log("Source line items:", itemCount);
    console.log("Mapped customers:", customers.length);
    console.log(
      "Null-customer sales -> General Customer:",
      nullCustomerSales
    );
    console.log("Location:", `${hub.code} - ${hub.name}`);
    console.log(
      "Existing invoice conflicts:",
      existingInvoices.length
    );
    console.log("");
    console.log("Mapped status counts:");
    console.log(
      "  COMPLETED:",
      statusCounts.get("COMPLETED") ?? 0
    );
    console.log("  OPEN:", statusCounts.get("OPEN") ?? 0);
    console.log("  VOID:", statusCounts.get("VOID") ?? 0);
    console.log("");
    console.log(
      "Cash/Zelle payment rows to preserve:",
      paymentRows
    );
    console.log(
      "Imported paid snapshots without fabricated payment rows:",
      importedPaymentSnapshots
    );
    console.log(
      "OPEN balance due:",
      money(openBalance).toFixed(2)
    );
    console.log("Validation errors:", errors.length);

    if (existingInvoices.length > 0) {
      console.log("");
      console.log("CONFLICTS:");
      console.log(existingInvoices);
    }

    if (errors.length > 0) {
      console.log("");
      console.log("ERRORS:");

      for (const error of errors.slice(0, 50)) {
        console.log(" -", error);
      }
    }

    if (
      errors.length > 0 ||
      existingInvoices.length > 0
    ) {
      process.exitCode = 1;
      return;
    }

    if (!APPLY) {
      console.log("");
      console.log("DRY RUN PASSED.");
      console.log(
        "No database records were created or changed."
      );
      return;
    }

    const beforeInventory = {
      balances:
        await prisma.backOfficeInventoryBalance.findMany({
          select: {
            id: true,
            quantity: true,
          },
          orderBy: {
            id: "asc",
          },
        }),
      movements:
        await prisma.backOfficeInventoryMovement.count(),
      allocations:
        await prisma.backOfficeInvoiceItemAllocation.count(),
    };

    let createdInvoices = 0;
    let createdItems = 0;
    let createdPayments = 0;

    await prisma.$transaction(
      async (tx) => {
        for (const sale of data.sales) {
          const customer =
            sale.customerId == null
              ? generalCustomer
              : customerMap.get(sale.customerId);

          if (!customer) {
            throw new Error(
              `${sale.invoiceNumber}: customer mapping disappeared`
            );
          }

          const status = mapStatus(sale.status);
          const saleDate = new Date(sale.saleDate);

          if (Number.isNaN(saleDate.getTime())) {
            throw new Error(
              `${sale.invoiceNumber}: invalid sale date`
            );
          }

          const voidedAt =
            sale.voidedAt?.trim()
              ? new Date(sale.voidedAt)
              : null;

          if (
            voidedAt &&
            Number.isNaN(voidedAt.getTime())
          ) {
            throw new Error(
              `${sale.invoiceNumber}: invalid void date`
            );
          }

          const invoice =
            await tx.backOfficeInvoice.create({
              data: {
                invoiceNumber: sale.invoiceNumber,
                source: "LEGACY_IMPORT",
                status,
                customerId: customer.id,
                customerFirstName:
                  customer.firstName,
                customerLastName:
                  customer.lastName,
                customerCompany:
                  customer.company ?? null,
                customerEmail:
                  customer.email ?? null,
                customerPhone:
                  customer.phone ?? null,
                pricingType:
                  customer.pricingType,
                locationId: hub.id,
                locationCode: hub.code,
                locationName: hub.name,
                legacySaleId: sale.id,
                subtotal: money(sale.subtotal),
                discountPercent: null,
                discountAmount: money(
                  sale.discount
                ),
                taxAmount: money(sale.tax),
                total: money(sale.total),
                amountPaid: money(
                  sale.amountPaid
                ),
                balanceDue: money(
                  sale.balanceDue
                ),
                customerNote: null,
                internalNote:
                  legacyInternalNote(sale),
                createdById: null,
                createdByName: null,
                completedAt:
                  status === "COMPLETED"
                    ? saleDate
                    : null,
                voidedAt:
                  status === "VOID"
                    ? voidedAt
                    : null,
                voidedById: null,
                voidedByName: null,
                voidReason:
                  status === "VOID"
                    ? sale.voidReason?.trim() ||
                      null
                    : null,
                createdAt: saleDate,
                updatedAt: saleDate,
              },
            });

          createdInvoices++;

          for (const item of sale.items) {
            const product =
              productMap.get(item.productId);

            if (!product) {
              throw new Error(
                `${sale.invoiceNumber}: product mapping disappeared`
              );
            }

            await tx.backOfficeInvoiceItem.create({
              data: {
                invoiceId: invoice.id,
                productId: null,
                sku:
                  product.itemCode?.trim() ||
                  null,
                productName: product.name,
                sellUnit: "UNIT",
                quantity: Number(
                  item.quantity
                ),
                unitsPerSellUnit: 1,
                baseUnitsTotal: Number(
                  item.quantity
                ),
                standardUnitPrice: money(
                  item.unitPrice
                ),
                unitPrice: money(
                  item.unitPrice
                ),
                lineTotal: money(
                  item.lineTotal
                ),
                priceAdjusted: false,
                priceAdjustmentReason: null,
                createdAt: saleDate,
                updatedAt: saleDate,
              },
            });

            createdItems++;
          }

          if (
            (sale.paymentMethod === "Cash" ||
              sale.paymentMethod === "Zelle") &&
            money(sale.amountPaid) > 0
          ) {
            await tx.backOfficeInvoicePayment.create({
              data: {
                invoiceId: invoice.id,
                type: "PAYMENT",
                method:
                  sale.paymentMethod === "Cash"
                    ? "CASH"
                    : "ZELLE",
                amount: money(
                  sale.amountPaid
                ),
                zelleReference: null,
                note:
                  "Historical payment imported from CashflowKaos.",
                receivedById: null,
                receivedByName: null,
                receivedAt: saleDate,
                createdAt: saleDate,
              },
            });

            createdPayments++;
          }
        }
      },
      {
        timeout: 120000,
      }
    );

    const afterInventory = {
      balances:
        await prisma.backOfficeInventoryBalance.findMany({
          select: {
            id: true,
            quantity: true,
          },
          orderBy: {
            id: "asc",
          },
        }),
      movements:
        await prisma.backOfficeInventoryMovement.count(),
      allocations:
        await prisma.backOfficeInvoiceItemAllocation.count(),
    };

    const inventoryChanged =
      JSON.stringify(beforeInventory) !==
      JSON.stringify(afterInventory);

    if (inventoryChanged) {
      throw new Error(
        "CRITICAL: Inventory baseline changed during historical migration."
      );
    }

    console.log("");
    console.log("IMPORT COMPLETE.");
    console.log(
      "Created invoices:",
      createdInvoices
    );
    console.log("Created items:", createdItems);
    console.log(
      "Created payment rows:",
      createdPayments
    );
    console.log(
      "Inventory unchanged:",
      !inventoryChanged
    );
  } finally {
    await prisma.$disconnect();
  }
})();