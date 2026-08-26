import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { replyMemberThread } from "../actions";

export const dynamic = "force-dynamic";

export default async function MemberMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireApprovedMember();

  if (user.role === "ADMIN") {
    redirect("/admin/messages");
  }

  const { id } = await params;

  const thread = await prisma.messageThread.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
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

  await prisma.message.updateMany({
    where: {
      threadId: thread.id,
      senderId: {
        not: user.id,
      },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return (
    <main className="member-account-page">
      <div className="member-account-shell">
        <header className="member-account-header">
          <Link href="/account" className="member-account-brand">
            <Image
              src="/logo/wordmark.png"
              alt="Ascend Peptide Co."
              width={2172}
              height={724}
              priority
              className="member-account-logo"
            />
          </Link>

          <Link
            href="/account/messages"
            className="member-header-link"
          >
            <ArrowLeft size={14} />
            Messages
          </Link>
        </header>

        <section className="member-account-hero member-message-hero">
          <div>
            <span className="admin-eyebrow">ASCEND SUPPORT</span>
            <h1>{thread.subject}</h1>
            <p>
              Private conversation with Ascend Peptide Co.
            </p>
          </div>
        </section>

        <section className="member-account-card member-thread-card">
          <div className="member-thread-messages">
            {thread.messages.map((message) => {
              const mine = message.senderId === user.id;

              return (
                <article
                  key={message.id}
                  className={
                    mine
                      ? "member-message-bubble member-message-mine"
                      : "member-message-bubble member-message-support"
                  }
                >
                  <div className="member-message-meta">
                    <strong>
                      {mine
                        ? "You"
                        : "Ascend Support"}
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
            action={replyMemberThread}
            className="member-thread-reply"
          >
            <input
              type="hidden"
              name="threadId"
              value={thread.id}
            />

            <label className="member-profile-field">
              <span>Reply</span>
              <textarea
                name="body"
                rows={5}
                required
                placeholder="Write a reply..."
              />
            </label>

            <button
              type="submit"
              className="member-primary-button"
            >
              <MessageSquare size={14} />
              Send Reply
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}