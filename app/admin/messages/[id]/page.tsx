import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { replyAdminThread } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const thread = await prisma.messageThread.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: true,
        },
      },
    },
  });

  if (!thread) {
    notFound();
  }

  const adminUsers = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  const adminIds = adminUsers.map((item) => item.id);

  await prisma.message.updateMany({
    where: {
      threadId: thread.id,
      senderId: {
        notIn: adminIds,
      },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

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
          <span className="admin-eyebrow">MEMBER CONVERSATION</span>
          <h1>{thread.subject}</h1>
          <p>
            {thread.user.firstName} {thread.user.lastName}
            {" · "}
            {thread.user.email}
          </p>
        </div>
      </div>

      <section className="admin-panel admin-thread-panel">
        <div className="admin-thread-messages">
          {thread.messages.map((message) => {
            const mine = adminIds.includes(message.senderId);

            return (
              <article
                key={message.id}
                className={
                  mine
                    ? "admin-thread-bubble admin-thread-admin"
                    : "admin-thread-bubble admin-thread-member"
                }
              >
                <div className="admin-thread-meta">
                  <strong>
                    {mine
                      ? "Ascend Support"
                      : `${thread.user.firstName} ${thread.user.lastName}`}
                  </strong>

                  <span>
                    {message.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p>{message.body}</p>
              </article>
            );
          })}
        </div>

        <form
          action={replyAdminThread}
          className="admin-thread-reply"
        >
          <input
            type="hidden"
            name="threadId"
            value={thread.id}
          />

          <label className="member-profile-field">
            <span>Reply to Member</span>
            <textarea
              name="body"
              rows={5}
              required
              placeholder="Write a reply..."
            />
          </label>

          <button
            type="submit"
            className="admin-primary-button"
          >
            <MessageSquare size={14} />
            Send Reply
          </button>
        </form>
      </section>
    </div>
  );
}