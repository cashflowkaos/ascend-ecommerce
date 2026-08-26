import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  KeyRound,
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
  resetMemberPassword,
  updateMemberAccount,
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
      dateOfBirth: true,
      ageCertifiedAt: true,
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

          <form
            action={updateMemberAccount}
            className="admin-member-edit-form"
          >
            <input
              type="hidden"
              name="id"
              value={member.id}
            />

            <div className="admin-member-edit-grid">
              <label className="admin-member-edit-field">
                <span>First Name</span>
                <input
                  name="firstName"
                  defaultValue={member.firstName}
                  required
                />
              </label>

              <label className="admin-member-edit-field">
                <span>Last Name</span>
                <input
                  name="lastName"
                  defaultValue={member.lastName}
                  required
                />
              </label>

              <label className="admin-member-edit-field admin-member-edit-wide">
                <span>Email Address</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={member.email}
                  required
                />

                <small>
                  This is the member's login and notification email.
                  Changing it will require the member to sign in again
                  using the new address.
                </small>
              </label>

              <label className="admin-member-edit-field admin-member-edit-wide">
                <span>Phone Number</span>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={member.phone ?? ""}
                />
              </label>
            </div>

            <div className="admin-member-edit-actions">
              <button
                type="submit"
                className="admin-member-button admin-member-button-approve"
              >
                Save Account Changes
              </button>
            </div>
          </form>
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

          {member.dateOfBirth && member.ageCertifiedAt ? (
            <div className="admin-member-detail-list">
              <div className="admin-member-detail-row">
                <span>Date of Birth</span>

                <strong>
                  {member.dateOfBirth.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </strong>
              </div>

              <div className="admin-member-detail-row">
                <span>Age</span>

                <strong>
                  {(() => {
                    const today = new Date();
                    const birthDate = member.dateOfBirth;

                    let age =
                      today.getUTCFullYear() -
                      birthDate.getUTCFullYear();

                    const birthdayPassed =
                      today.getUTCMonth() >
                        birthDate.getUTCMonth() ||
                      (today.getUTCMonth() ===
                        birthDate.getUTCMonth() &&
                        today.getUTCDate() >=
                          birthDate.getUTCDate());

                    if (!birthdayPassed) {
                      age--;
                    }

                    return `${age} years old`;
                  })()}
                </strong>
              </div>

              <div className="admin-member-detail-row">
                <span>21+ Status</span>
                <strong>Verified 21+</strong>
              </div>

              <div className="admin-member-detail-row">
                <span>Certified</span>

                <strong>
                  {member.ageCertifiedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </div>
            </div>
          ) : (
            <div className="admin-member-age-placeholder">
              <strong>Legacy Member</strong>

              <p>
                Age verification was not collected when this
                membership record was created.
              </p>
            </div>
          )}
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

      <section className="admin-panel admin-member-decision-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              ACCOUNT SECURITY
            </span>

            <h2>Temporary Password</h2>

            <p>
              Set a temporary password if this member cannot
              access their account. Existing sessions will be
              signed out, and the member will be required to
              choose a new password after signing in.
            </p>
          </div>

          <KeyRound size={19} />
        </div>

        <form
          action={resetMemberPassword}
          className="admin-member-password-form"
        >
          <input
            type="hidden"
            name="id"
            value={member.id}
          />

          <label className="admin-member-password-field">
            <span>Temporary Password</span>

            <input
              name="temporaryPassword"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
            />
          </label>

          <button
            type="submit"
            className="admin-member-button admin-member-button-approve"
          >
            <KeyRound size={15} />
            Set Temporary Password
          </button>
        </form>
      </section>
    </div>
  );
}
