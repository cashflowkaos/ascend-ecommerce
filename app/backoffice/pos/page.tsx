import { BackOfficePosRegister } from "@/components/backoffice/BackOfficePosRegister";
import { prisma } from "@/lib/prisma";

export default async function BackOfficePosPage() {
  const [customers, locations, products, websiteOrders] =
    await Promise.all([
      prisma.backOfficeCustomer.findMany({
        where: { active: true },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
        select: {
          id: true,
          userId: true,
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

      prisma.order.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
          backOfficeInvoice: null,
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          channel: true,
          fulfillmentMethod: true,
          shippingAmount: true,
          subtotal: true,
          total: true,
          createdAt: true,
          items: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
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

  const customerByUserId = new Map(
    customers
      .filter((customer) => customer.userId)
      .map((customer) => [
        customer.userId as string,
        customer.id,
      ])
  );

  const customerNameByUserId = new Map(
    customers
      .filter((customer) => customer.userId)
      .map((customer) => [
        customer.userId as string,
        `${customer.firstName} ${customer.lastName}`.trim(),
      ])
  );

  const productBySku = new Map(
    products.map((product) => [product.sku, product.id])
  );

  const posWebsiteOrders = websiteOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName:
      customerNameByUserId.get(order.userId) ?? "Unknown Customer",
    customerId: customerByUserId.get(order.userId) ?? null,
    channel: order.channel,
    fulfillmentMethod: order.fulfillmentMethod,
    shippingAmount: Number(order.shippingAmount),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => {
      const isDistro =
        item.variantId === null &&
        item.strength === "Distro";

      const backOfficeProductId = isDistro
        ? item.sku
          ? productBySku.get(item.sku) ?? null
          : null
        : item.variant?.backOfficeProductId ?? null;

      return {
        id: item.id,
        productId: backOfficeProductId,
        productName: item.productName,
        sku: item.sku,
        strength: item.strength,
        sellUnit: isDistro ? ("KIT" as const) : ("UNIT" as const),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        mapped: backOfficeProductId !== null,
      };
    }),
  }));

  const posCustomers = customers.map(
    ({ userId: _userId, ...customer }) => customer
  );

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
          <strong>{posCustomers.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Locations</span>
          <strong>{locations.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Website Orders</span>
          <strong>{posWebsiteOrders.length}</strong>
        </div>
      </div>

      <BackOfficePosRegister
        customers={posCustomers}
        locations={locations}
        products={posProducts}
        websiteOrders={posWebsiteOrders}
      />
    </>
  );
}
