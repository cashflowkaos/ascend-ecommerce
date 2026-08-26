import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  MessageSquare,
  ShoppingBag,
  UserCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboard() {
  const [
    activeProducts,
    variants,
    pendingMembers,
    newOrderRequests,
    paidAwaitingFulfillment,
    totalOrders,
    paidOrders,
    unreadMessages,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({
      where: {
        active: true,
      },
    }),

    prisma.productVariant.findMany({
      where: {
        active: true,
        product: {
          active: true,
          trackInventory: true,
        },
      },
      select: {
        id: true,
        strength: true,
        inventoryQty: true,
        lowStockAt: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          inventoryQty: "asc",
        },
        {
          product: {
            name: "asc",
          },
        },
      ],
    }),

    prisma.user.count({
      where: {
        role: "MEMBER",
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        paymentStatus: "PAID",
        status: {
          in: [
            "CONFIRMED",
            "PROCESSING",
          ],
        },
      },
    }),

    prisma.order.count(),

    prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        total: true,
      },
    }),

    prisma.message.count({
      where: {
        readAt: null,
      },
    }),

    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  const totalInventory = variants.reduce(
    (sum, variant) =>
      sum + variant.inventoryQty,
    0
  );

  const lowStockVariants = variants.filter(
    (variant) =>
      variant.inventoryQty <= variant.lowStockAt
  );

  const paidOrderValue = paidOrders.reduce(
    (sum, order) =>
      sum + Number(order.total),
    0
  );

  const stats = [
    {
      label: "Active Products",
      value: activeProducts,
      detail: `${totalInventory} variant units`,
      icon: Boxes,
    },
    {
      label: "Total Orders",
      value: totalOrders,
      detail: `${newOrderRequests} new requests`,
      icon: ShoppingBag,
    },
    {
      label: "Paid Order Value",
      value: money(paidOrderValue),
      detail: `${paidAwaitingFulfillment} awaiting fulfillment`,
      icon: CircleDollarSign,
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      detail: "Member conversations",
      icon: MessageSquare,
    },
  ];

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            OVERVIEW
          </span>

          <h1>Dashboard</h1>

          <p>
            Monitor orders, fulfillment, inventory,
            members and communications.
          </p>
        </div>
      </div>

      <section className="admin-stat-grid">
        {stats.map(
          ({
            label,
            value,
            detail,
            icon: Icon,
          }) => (
            <article
              className="admin-stat-card"
              key={label}
            >
              <div className="admin-stat-icon">
                <Icon
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <div className="admin-stat-value">
                {value}
              </div>

              <div className="admin-stat-label">
                {label}
              </div>

              <div className="admin-stat-detail">
                {detail}
              </div>
            </article>
          )
        )}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">
                OPERATIONS
              </span>

              <h2>Recent Orders</h2>
            </div>

            <Link
              href="/admin/orders"
              className="admin-text-link"
            >
              View Orders
            </Link>
          </div>

          <div className="admin-product-list">
            {recentOrders.length === 0 ? (
              <div className="admin-attention-item">
                <ShoppingBag size={19} />

                <div>
                  <strong>No orders yet</strong>
                  <span>
                    New order requests will appear here.
                  </span>
                </div>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="admin-product-row"
                  key={order.id}
                >
                  <div className="admin-product-primary">
                    <strong>
                      {order.orderNumber}
                    </strong>

                    <span>
                      {order.user.firstName}{" "}
                      {order.user.lastName}
                      {" · "}
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="admin-product-meta">
                    <span>
                      {money(Number(order.total))}
                    </span>

                    <span>
                      {order.status}
                    </span>

                    <span
                      className={
                        order.paymentStatus === "PAID"
                          ? "admin-status admin-status-live"
                          : "admin-status"
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        <aside className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">
                ATTENTION
              </span>

              <h2>Needs Attention</h2>
            </div>
          </div>

          <div className="admin-attention-list">
            <Link
              href="/admin/orders"
              className="admin-attention-item"
            >
              <ShoppingBag size={19} />

              <div>
                <strong>
                  {newOrderRequests} new order{" "}
                  {newOrderRequests === 1
                    ? "request"
                    : "requests"}
                </strong>

                <span>
                  Awaiting payment or review
                </span>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="admin-attention-item"
            >
              <CircleDollarSign size={19} />

              <div>
                <strong>
                  {paidAwaitingFulfillment} paid{" "}
                  {paidAwaitingFulfillment === 1
                    ? "order"
                    : "orders"}
                </strong>

                <span>
                  Awaiting fulfillment
                </span>
              </div>
            </Link>

            <Link
              href="/admin/members"
              className="admin-attention-item"
            >
              <UserCheck size={19} />

              <div>
                <strong>
                  {pendingMembers} pending{" "}
                  {pendingMembers === 1
                    ? "member"
                    : "members"}
                </strong>

                <span>
                  Awaiting membership review
                </span>
              </div>
            </Link>

            <Link
              href="/admin/messages"
              className="admin-attention-item"
            >
              <MessageSquare size={19} />

              <div>
                <strong>
                  {unreadMessages} unread{" "}
                  {unreadMessages === 1
                    ? "message"
                    : "messages"}
                </strong>

                <span>
                  Member conversations requiring attention
                </span>
              </div>
            </Link>
          </div>
        </aside>
      </section>

      <section className="admin-panel mt-6">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              INVENTORY
            </span>

            <h2>Inventory Attention</h2>
          </div>

          <Link
            href="/admin/inventory"
            className="admin-text-link"
          >
            Manage Inventory
          </Link>
        </div>

        {lowStockVariants.length === 0 ? (
          <div className="admin-attention-list">
            <div className="admin-attention-item">
              <Boxes size={19} />

              <div>
                <strong>
                  Inventory levels look good
                </strong>

                <span>
                  No variants are at or below their
                  low-stock threshold.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-product-list">
            {lowStockVariants.map((variant) => (
              <Link
                href={`/admin/inventory/${variant.product.id}`}
                className="admin-product-row"
                key={variant.id}
              >
                <div className="admin-product-primary">
                  <strong>
                    {variant.product.name}
                  </strong>

                  <span>
                    {variant.strength}
                  </span>
                </div>

                <div className="admin-product-meta">
                  <span className="admin-stock-low">
                    {variant.inventoryQty} units
                  </span>

                  <span>
                    Low at {variant.lowStockAt}
                  </span>

                  <span className="admin-status">
                    <AlertTriangle size={13} />
                    Low Stock
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}