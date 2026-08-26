import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  approveMember,
  declineMember,
  disableMember,
} from "../actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "admin-member-status admin-member-status-approved";

    case "DECLINED":
      return "admin-member-status admin-member-status-declined";

    case "DISABLED":
      return "admin-member-status admin-member-status-disabled";

    default:
      return "admin-member-status admin-member-status-pending";
  }
}

export default async function MemberReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.user.findFirst({
    where: {
      id,
      role: "MEMBER",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      approvedAt: true,
      disabledAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,

      addresses: {
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          label: true,
          firstName: true,
          lastName: true,
          company: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          isDefault: true,
        },
      },
    },
  });

  if (!member) {
    notFound();
  }

  const primaryAddress =
    member.addresses.find((address) => address.isDefault) ??
    member.addresses[0] ??
    null;

  return (
    <div className="admin-members-page">
      <div className="admin-page-heading">
        <div>
          <Link
            href="/admin/members"
            className="admin-member-back-link"
          >
            <ArrowLeft size={15} />
            Back to Members
          </Link>

          <span className="admin-eyebrow">
            MEMBER APPLICATION
          </span>

          <h1>
            {member.firstName} {member.lastName}
          </h1>

          <p>
            Review the complete member application before
            granting access to the Ascend member catalog.
          </p>
        </div>

        <div className="admin-member-review-status">
          <span className={statusClass(member.status)}>
            {member.status}
          </span>
        </div>
      </div>

      <section className="admin-member-review-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">
                APPLICANT
              </span>

              <h2>Contact Information</h2>
            </div>

            <UserRound size={20} />
          </div>

          <div className="admin-member-detail-list">
            <div className="admin-member-detail-row">
              <span>Full Name</span>
              <strong>
                {member.firstName} {member.lastName}
              </strong>
            </div>

            <div className="admin-member-detail-row">
              <span>Email Address</span>

              <a href={`mailto:${member.email}`}>
                <Mail size={14} />
                {member.email}
              </a>
            </div>

            <div className="admin-member-detail-row">
              <span>Phone Number</span>

              {member.phone ? (
                <a href={`tel:${member.phone}`}>
                  <Phone size={14} />
                  {member.phone}
                </a>
              ) : (
                <strong>—</strong>
              )}
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">
                ACCOUNT
              </span>

              <h2>Application Record</h2>
            </div>

            <Clock3 size={20} />
          </div>

          <div className="admin-member-detail-list">
            <div className="admin-member-detail-row">
              <span>Status</span>

              <strong>{member.status}</strong>
            </div>

            <div className="admin-member-detail-row">
              <span>Applied</span>

              <strong>
                {formatDate(member.createdAt)}
              </strong>
            </div>

            <div className="admin-member-detail-row">
              <span>Approved</span>

              <strong>
                {formatDate(member.approvedAt)}
              </strong>
            </div>

            <div className="admin-member-detail-row">
              <span>Last Login</span>

              <strong>
                {formatDateTime(member.lastLoginAt)}
              </strong>
            </div>

            <div className="admin-member-detail-row">
              <span>Account Role</span>

              <strong>{member.role}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel admin-member-address-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">
                SHIPPING
              </span>

              <h2>Address Information</h2>
            </div>

            <MapPin size={20} />
          </div>

          {primaryAddress ? (
            <div className="admin-member-address">
              <strong>
                {primaryAddress.firstName}{" "}
                {primaryAddress.lastName}
              </strong>

              {primaryAddress.company && (
                <span>{primaryAddress.company}</span>
              )}

              <span>{primaryAddress.address1}</span>

              {primaryAddress.address2 && (
                <span>{primaryAddress.address2}</span>
              )}

              <span>
                {primaryAddress.city},{" "}
                {primaryAddress.state}{" "}
                {primaryAddress.postalCode}
              </span>

              <span>{primaryAddress.country}</span>

              {primaryAddress.phone && (
                <span>{primaryAddress.phone}</span>
              )}

              {primaryAddress.isDefault && (
                <small>Default Shipping Address</small>
              )}
            </div>
          ) : (
            <div className="admin-member-empty">
              No shipping address is attached to this member.
            </div>
          )}
        </article>

        <article className="admin-panel admin-member-age-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">
                AGE VERIFICATION
              </span>

              <h2>21+ Verification</h2>
            </div>

            <CalendarDays size={20} />
          </div>

          <div className="admin-member-age-placeholder">
            <strong>Not yet collected</strong>

            <p>
              Date of birth verification will appear here
              after the 21+ signup requirement is implemented.
            </p>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-member-decision-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              ACCESS DECISION
            </span>

            <h2>Membership Review</h2>

            <p>
              Review the application information above before
              changing this member's access.
            </p>
          </div>
        </div>

        <div className="admin-member-review-actions">
          {member.status !== "APPROVED" && (
            <form action={approveMember}>
              <input
                type="hidden"
                name="id"
                value={member.id}
              />

              <button
                type="submit"
                className="admin-member-button admin-member-button-approve"
              >
                <Check size={15} />
                Approve Membership
              </button>
            </form>
          )}

          {member.status === "PENDING" && (
            <form action={declineMember}>
              <input
                type="hidden"
                name="id"
                value={member.id}
              />

              <button
                type="submit"
                className="admin-member-button admin-member-button-decline"
              >
                <X size={15} />
                Decline Application
              </button>
            </form>
          )}

          {member.status === "APPROVED" && (
            <form action={disableMember}>
              <input
                type="hidden"
                name="id"
                value={member.id}
              />

              <button
                type="submit"
                className="admin-member-button admin-member-button-disable"
              >
                <ShieldOff size={15} />
                Disable Member
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
