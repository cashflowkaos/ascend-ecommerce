import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminMessageMemberSearch from "@/components/admin/AdminMessageMemberSearch";
import AdminBroadcastPanel from "@/components/admin/AdminBroadcastPanel";
import AdminBroadcastHistory from "@/components/admin/AdminBroadcastHistory";

export const dynamic = "force-dynamic";

export default async function AdminNewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{
    broadcast?: string;
    broadcastError?: string;
    recipients?: string;
  }>;
}) {
  await requireAdmin();

  const params = await searchParams;

  const [memberCount, broadcasts] =
    await Promise.all([
      prisma.user.count({
        where: {
          role: "MEMBER",
          status: "APPROVED",
        },
      }),

      prisma.messageBroadcast.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 25,
        select: {
          id: true,
          subject: true,
          body: true,
          recipientCount: true,
          sentByName: true,
          createdAt: true,
        },
      }),
    ]);

  const broadcastSent =
    params.broadcast === "sent";

  const broadcastError =
    params.broadcastError;

  return (
    <div className="admin-members-page">
      <Link
        href="/admin/messages"
        className="admin-member-back-link"
      >
        <ArrowLeft size={14} />
        Back to Messages
      </Link>

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            COMMUNICATIONS
          </span>

          <h1>Message Center</h1>

          <p>
            Find members, manage conversations,
            or send an announcement to all
            approved members.
          </p>
        </div>
      </div>

      {broadcastSent && (
        <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-neutral-200 bg-white p-4">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <strong className="block text-sm">
              Broadcast complete
            </strong>

            <span className="mt-1 block text-sm text-neutral-500">
              Sent to {params.recipients ?? "0"} member{" "}
              {Number(params.recipients ?? "0") === 1
                ? "inbox"
                : "inboxes"}.
            </span>
          </div>
        </div>
      )}

      {broadcastError && (
        <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-neutral-200 bg-white p-4">
          <CircleAlert
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <strong className="block text-sm">
              Broadcast not sent
            </strong>

            <span className="mt-1 block text-sm text-neutral-500">
              {broadcastError === "no-members"
                ? "There are no approved members to receive this announcement."
                : broadcastError === "subject"
                  ? "The subject is too long."
                  : "Enter both a subject and message."}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <AdminMessageMemberSearch />

        <AdminBroadcastPanel
          memberCount={memberCount}
        />

        <AdminBroadcastHistory
          broadcasts={broadcasts}
        />
      </div>
    </div>
  );
}