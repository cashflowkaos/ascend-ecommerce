import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getMessageRetentionCutoff } from "@/lib/message-retention";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const retentionCutoff =
    getMessageRetentionCutoff();

  const threads = await prisma.messageThread.findMany({
    where: {
      updatedAt: {
        gte: retentionCutoff,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      user: true,
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: true,
        },
      },
    },
  });

  const adminUsers = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  const adminIds = adminUsers.map((admin) => admin.id);

  const unreadByThread = await prisma.message.groupBy({
    by: ["threadId"],
    where: {
      readAt: null,
      senderId: {
        notIn: adminIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  const unreadMap = new Map(
    unreadByThread.map((item) => [
      item.threadId,
      item._count._all,
    ])
  );

  return (
    <div className="admin-members-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">COMMUNICATIONS</span>
          <h1>Messages</h1>
          <p>
            Private member conversations and support requests.
          </p>
        </div>

        <Link
          href="/admin/messages/new"
          className="admin-primary-button"
        >
          <MessageSquare size={14} />
          Message Center
        </Link>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">INBOX</span>
            <h2>Member Conversations</h2>
          </div>

          <MessageSquare size={19} />
        </div>

        <div className="admin-message-list">
          {threads.length === 0 ? (
            <div className="admin-message-empty">
              No member conversations yet.
            </div>
          ) : (
            threads.map((thread) => {
              const latest = thread.messages[0];
              const unread = unreadMap.get(thread.id) ?? 0;

              return (
                <Link
                  key={thread.id}
                  href={`/admin/messages/${thread.id}`}
                  className="admin-message-row"
                >
                  <div className="admin-message-member">
                    <strong>
                      {thread.user.firstName} {thread.user.lastName}
                    </strong>
                    <span>{thread.user.email}</span>
                  </div>

                  <div className="admin-message-preview">
                    <strong>{thread.subject}</strong>
                    <span>
                      {latest
                        ? latest.body.length > 100
                          ? `${latest.body.slice(0, 100)}...`
                          : latest.body
                        : "No messages"}
                    </span>
                  </div>

                  <div className="admin-message-status">
                    {unread > 0 && (
                      <span className="admin-message-unread">
                        {unread} unread
                      </span>
                    )}

                    <small>{thread.status}</small>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

