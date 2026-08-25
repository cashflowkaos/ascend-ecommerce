import {
  AlertTriangle,
  Boxes,
  MessageSquare,
  ShoppingBag,
  UserCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    productCount,
    totalInventory,
    lowStockCount,
    memberCount,
    pendingMembers,
    orderCount,
    unreadMessages,
  ] = await Promise.all([
    prisma.product.count({
      where: { active: true },
    }),

    prisma.product.aggregate({
      _sum: { inventoryQty: true },
      where: { active: true },
    }),

    prisma.product.count({
      where: {
        active: true,
        trackInventory: true,
        inventoryQty: {
          lte: 5,
        },
      },
    }),

    prisma.user.count({
      where: {
        role: "MEMBER",
        status: "APPROVED",
      },
    }),

    prisma.user.count({
      where: {
        role: "MEMBER",
        status: "PENDING",
      },
    }),

    prisma.order.count(),

    prisma.message.count({
      where: {
        readAt: null,
      },
    }),
  ]);

  const stats = [
    {
      label: "Active Products",
      value: productCount,
      detail: `${totalInventory._sum.inventoryQty ?? 0} total units`,
      icon: Boxes,
    },
    {
      label: "Approved Members",
      value: memberCount,
      detail: `${pendingMembers} awaiting approval`,
      icon: Users,
    },
    {
      label: "Orders",
      value: orderCount,
      detail: "All orders",
      icon: ShoppingBag,
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      detail: "Member conversations",
      icon: MessageSquare,
    },
  ];

  const recentProducts = await prisma.product.findMany({
    orderBy: [
      { updatedAt: "desc" },
      { name: "asc" },
    ],
    take: 6,
    select: {
      id: true,
      name: true,
      strength: true,
      inventoryQty: true,
      lowStockAt: true,
      memberPrice: true,
      active: true,
      purchasable: true,
    },
  });

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>
            Manage Ascend inventory, members, orders and communications.
          </p>
        </div>
      </div>

      <section className="admin-stat-grid">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <article className="admin-stat-card" key={label}>
            <div className="admin-stat-icon">
              <Icon size={20} strokeWidth={1.8} />
            </div>

            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-detail">{detail}</div>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">INVENTORY</span>
              <h2>Product Overview</h2>
            </div>

            <a href="/admin/inventory" className="admin-text-link">
              Manage Inventory
            </a>
          </div>

          <div className="admin-product-list">
            {recentProducts.map((product) => {
              const low =
                product.inventoryQty <= product.lowStockAt;

              return (
                <div className="admin-product-row" key={product.id}>
                  <div className="admin-product-primary">
                    <strong>{product.name}</strong>
                    <span>{product.strength}</span>
                  </div>

                  <div className="admin-product-meta">
                    <span>
                      {product.memberPrice
                        ? `$${product.memberPrice.toString()}`
                        : "No price"}
                    </span>

                    <span className={low ? "admin-stock-low" : ""}>
                      {product.inventoryQty} units
                    </span>

                    <span
                      className={
                        product.purchasable
                          ? "admin-status admin-status-live"
                          : "admin-status"
                      }
                    >
                      {product.purchasable ? "Purchasable" : "Locked"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">ATTENTION</span>
              <h2>Needs Review</h2>
            </div>
          </div>

          <div className="admin-attention-list">
            <div className="admin-attention-item">
              <AlertTriangle size={19} />
              <div>
                <strong>{lowStockCount} low-stock products</strong>
                <span>At or below inventory threshold</span>
              </div>
            </div>

            <div className="admin-attention-item">
              <UserCheck size={19} />
              <div>
                <strong>{pendingMembers} pending members</strong>
                <span>Awaiting membership review</span>
              </div>
            </div>

            <div className="admin-attention-item">
              <MessageSquare size={19} />
              <div>
                <strong>{unreadMessages} unread messages</strong>
                <span>Member conversations requiring attention</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
