import Link from "next/link";
import {
  Check,
  Clock3,
  Mail,
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
} from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default async function MembersPage() {
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
    },
    orderBy: [
      { createdAt: "desc" },
      { lastName: "asc" },
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      approvedAt: true,
      disabledAt: true,
      createdAt: true,
    },
  });

  const pending = members.filter(
    (member) => member.status === "PENDING"
  ).length;

  const approved = members.filter(
    (member) => member.status === "APPROVED"
  ).length;

  const declined = members.filter(
    (member) => member.status === "DECLINED"
  ).length;

  const disabled = members.filter(
    (member) => member.status === "DISABLED"
  ).length;

  return (
    <div className="admin-members-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">MEMBERS</span>
          <h1>Member Management</h1>
          <p>
            Review applications and manage access to the Ascend member catalog.
          </p>
        </div>
      </div>

      <section className="admin-member-stat-grid">
        <article className="admin-member-stat">
          <Clock3 size={18} />
          <div>
            <strong>{pending}</strong>
            <span>Pending</span>
          </div>
        </article>

        <article className="admin-member-stat">
          <Check size={18} />
          <div>
            <strong>{approved}</strong>
            <span>Approved</span>
          </div>
        </article>

        <article className="admin-member-stat">
          <X size={18} />
          <div>
            <strong>{declined}</strong>
            <span>Declined</span>
          </div>
        </article>

        <article className="admin-member-stat">
          <ShieldOff size={18} />
          <div>
            <strong>{disabled}</strong>
            <span>Disabled</span>
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">DIRECTORY</span>
            <h2>Members</h2>
          </div>

          <span className="admin-member-total">
            {members.length} total
          </span>
        </div>

        {members.length === 0 ? (
          <div className="admin-member-empty">
            No member applications yet.
          </div>
        ) : (
          <div className="admin-member-list">
            {members.map((member) => (
              <article
                className="admin-member-card"
                key={member.id}
              >
                <div className="admin-member-identity">
                  <div className="admin-member-avatar">
                    <UserRound size={19} />
                  </div>

                  <div>
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="admin-member-name-link"
                    >
                      {member.firstName} {member.lastName}
                    </Link>

                    <span>
                      Applied {formatDate(member.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="admin-member-contact">
                  <a href={`mailto:${member.email}`}>
                    <Mail size={14} />
                    {member.email}
                  </a>

                  {member.phone && (
                    <a href={`tel:${member.phone}`}>
                      <Phone size={14} />
                      {member.phone}
                    </a>
                  )}
                </div>

                <div className="admin-member-state">
                  <span className={statusClass(member.status)}>
                    {member.status}
                  </span>

                  {member.approvedAt && (
                    <small>
                      Approved {formatDate(member.approvedAt)}
                    </small>
                  )}

                  {member.disabledAt && (
                    <small>
                      Disabled {formatDate(member.disabledAt)}
                    </small>
                  )}
                </div>

                <div className="admin-member-actions">
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
                        Approve
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
                        Decline
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
                        Disable
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}