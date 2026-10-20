import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createBackOfficePurchaseOrder } from "../actions";
import BackOfficePurchaseOrderForm from "@/components/backoffice/BackOfficePurchaseOrderForm";

export const dynamic = "force-dynamic";

export default async function NewBackOfficePurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([
    prisma.backOfficeSupplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.backOfficeProduct.findMany({
      where: { active: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        sku: true,
        name: true,
        inventoryType: true,
        unitsPerKit: true,
        cost: true,
      },
    }),
  ]);

  const formProducts = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    inventoryType: product.inventoryType,
    unitsPerKit: product.unitsPerKit,
    cost:
      product.cost === null
        ? null
        : Number(product.cost),
  }));

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            PURCHASING / NEW PURCHASE ORDER
          </span>
          <h1>Create Purchase Order</h1>
          <p>
            Record inventory purchases from a supplier. Inventory
            will not change until the order is received.
          </p>
        </div>

        <Link
          href="/backoffice/purchasing"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Purchasing
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <div className="backoffice-panel">
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                SUPPLIER REQUIRED
              </span>
              <h2>Add a Supplier First</h2>
            </div>
          </div>

          <p>
            A purchase order must be connected to an active supplier.
          </p>

          <div className="backoffice-form-actions">
            <Link
              href="/backoffice/suppliers/new"
              className="backoffice-primary-button"
            >
              Add Supplier
            </Link>
          </div>
        </div>
      ) : (
        <form
          action={createBackOfficePurchaseOrder}
          className="backoffice-panel backoffice-product-form"
        >
          <div className="backoffice-panel-heading">
            <div>
              <span className="backoffice-eyebrow">
                PURCHASE ORDER
              </span>
              <h2>Order Details</h2>
            </div>
          </div>

          <BackOfficePurchaseOrderForm
            suppliers={suppliers}
            products={formProducts}
          />

          <div className="backoffice-form-actions">
            <Link
              href="/backoffice/purchasing"
              className="backoffice-secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="backoffice-primary-button"
            >
              Create Purchase Order
            </button>
          </div>
        </form>
      )}
    </>
  );
}
