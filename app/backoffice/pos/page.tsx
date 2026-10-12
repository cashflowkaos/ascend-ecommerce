import { BackOfficePosRegister } from "@/components/backoffice/BackOfficePosRegister";
import { prisma } from "@/lib/prisma";

export default async function BackOfficePosPage() {
  const [customers, locations, products] = await Promise.all([
    prisma.backOfficeCustomer.findMany({
      where: { active: true },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        phone: true,
        pricingType: true,
      },
    }),

    prisma.backOfficeLocation.findMany({
      where: { active: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        code: true,
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
        cost: true,
        retailPrice: true,
        unitsPerKit: true,
        batches: {
          orderBy: [
            { receivedAt: "asc" },
            { createdAt: "asc" },
          ],
          select: {
            balances: {
              select: {
                locationId: true,
                quantity: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const posProducts = products.map((product) => {
    const quantities: Record<string, number> = {};

    for (const batch of product.batches) {
      for (const balance of batch.balances) {
        quantities[balance.locationId] =
          (quantities[balance.locationId] ?? 0) +
          balance.quantity;
      }
    }

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      cost:
        product.cost === null
          ? null
          : Number(product.cost),
      retailPrice:
        product.retailPrice === null
          ? null
          : Number(product.retailPrice),
      unitsPerKit: product.unitsPerKit,
      quantities,
    };
  });

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">
            POINT OF SALE
          </span>

          <h1>POS</h1>

          <p>
            Create sales, collect payments, and deduct physical
            inventory from the selected location.
          </p>
        </div>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Products</span>
          <strong>{posProducts.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Customers</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Locations</span>
          <strong>{locations.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Register</span>
          <strong>Ready</strong>
        </div>
      </div>

      <BackOfficePosRegister
        customers={customers}
        locations={locations}
        products={posProducts}
      />
    </>
  );
}