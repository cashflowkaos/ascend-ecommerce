import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock3,
  LogOut,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { memberSignOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const currentUser = await requireUser();

  if (currentUser.role === "ADMIN") {
    redirect("/admin");
  }

  if (currentUser.mustChangePassword) {
    redirect("/account/password");
  }

  const member = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      approvedAt: true,
      createdAt: true,
      addresses: {
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "asc" },
        ],
      },
      _count: {
        select: {
          orders: true,
          messageThreads: true,
        },
      },
    },
  });

  if (!member) {
    redirect("/signin");
  }

  const shippingAddress =
    member.addresses.find((address) => address.isDefault) ??
    member.addresses[0] ??
    null;

  if (member.status === "PENDING") {
    return (
      <main className="member-account-page">
        <div className="member-account-shell member-account-narrow">
          <Link href="/" className="auth-brand">
            <Image
              src="/logo/wordmark.png"
              alt="Ascend Peptide Co."
              width={250}
              height={95}
              priority
              className="member-account-logo"
            />
          </Link>

          <section className="member-pending-card">
            <Clock3 size={28} />

            <span className="admin-eyebrow">
              MEMBERSHIP REVIEW
            </span>

            <h1>Pending Approval</h1>

            <p>
              Hello {member.firstName}. Your Ascend membership
              request is still being reviewed.
            </p>

            <p>
              You will receive an email when your account has
              been approved.
            </p>

            <div className="member-pending-actions">
              <Link href="/" className="member-secondary-button">
                Return to Website
              </Link>

              <form action={memberSignOut}>
                <button
                  type="submit"
                  className="member-secondary-button"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (member.status !== "APPROVED") {
    return (
      <main className="member-account-page">
        <div className="member-account-shell member-account-narrow">
          <Link href="/" className="auth-brand">
            <Image
              src="/logo/wordmark.png"
              alt="Ascend Peptide Co."
              width={250}
              height={95}
              priority
              className="member-account-logo"
            />
          </Link>

          <section className="member-pending-card">
            <span className="admin-eyebrow">
              MEMBERSHIP
            </span>

            <h1>Account Unavailable</h1>

            <p>
              This membership is not currently active.
              Contact Ascend Support if you need assistance.
            </p>

            <a
              href="mailto:support@ascendpepco.com"
              className="member-primary-button"
            >
              Contact Support
            </a>

            <form action={memberSignOut}>
              <button
                type="submit"
                className="member-secondary-button"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="member-account-page">
      <div className="member-account-shell">
        <header className="member-account-header">
          <Link href="/" className="member-account-brand">
            <Image
              src="/logo/wordmark.png"
              alt="Ascend Peptide Co."
              width={250}
              height={95}
              priority
              className="member-account-logo"
            />
          </Link>

          <div className="member-account-header-actions">
            <Link href="/" className="member-header-link">
              View Website
            </Link>

            <form action={memberSignOut}>
              <button
                type="submit"
                className="member-header-link member-signout"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <section className="member-account-hero">
          <div>
            <span className="admin-eyebrow">
              MEMBER ACCOUNT
            </span>

            <h1>Welcome, {member.firstName}</h1>

            <p>
              Manage your Ascend account, shipping information,
              orders and member access.
            </p>
          </div>

          <div className="member-approved-badge">
            Approved Member
          </div>
        </section>

        <section className="member-account-stat-grid">
          <article className="member-account-stat">
            <ShoppingBag size={19} />

            <div>
              <strong>{member._count.orders}</strong>
              <span>Orders</span>
              <small>Current & Past</small>
            </div>
          </article>

          <Link
            href="/account/messages"
            className="member-account-stat member-account-stat-link"
          >
            <Mail size={19} />

            <div>
              <strong>{member._count.messageThreads}</strong>
              <span>Messenger Center</span>
              <small>Contact Ascend Support</small>
            </div>
          </Link>

          <article className="member-account-stat">
            <Package size={19} />

            <div>
              <strong>Active</strong>
              <span>Member Access</span>
              <small>
                Member Since{" "}
                {member.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </small>
            </div>
          </article>
        </section>

        <section className="member-account-grid">
          <article className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">
                  PROFILE
                </span>

                <h2>Account Information</h2>
              </div>

              <UserRound size={19} />
            </div>

            <div className="member-account-detail-list">
              <div>
                <span>Name</span>
                <strong>
                  {member.firstName} {member.lastName}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{member.email}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{member.phone || "—"}</strong>
              </div>
            </div>

            <Link
              href="/account/profile"
              className="member-card-link"
            >
              Manage Profile
            </Link>
          </article>

          <article className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">
                  SHIPPING
                </span>

                <h2>Default Address</h2>
              </div>

              <MapPin size={19} />
            </div>

            {shippingAddress ? (
              <div className="member-address-preview">
                <strong>
                  {shippingAddress.firstName}{" "}
                  {shippingAddress.lastName}
                </strong>

                <span>{shippingAddress.address1}</span>

                {shippingAddress.address2 && (
                  <span>{shippingAddress.address2}</span>
                )}

                <span>
                  {shippingAddress.city},{" "}
                  {shippingAddress.state}{" "}
                  {shippingAddress.postalCode}
                </span>
              </div>
            ) : (
              <p className="member-card-empty">
                No shipping address saved.
              </p>
            )}

            <Link
              href="/account/profile"
              className="member-card-link"
            >
              Manage Address
            </Link>
          </article>

          <article className="member-account-card member-account-card-wide">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">
                  MEMBER CATALOG
                </span>

                <h2>Exclusive Member Access</h2>
              </div>

              <ShoppingBag size={19} />
            </div>

            <p className="member-card-description">
              Browse the Ascend research catalog with approved
              member pricing and purchasing availability.
            </p>

            <Link
              href="/compounds"
              className="member-primary-button"
            >
              Browse Member Catalog
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}