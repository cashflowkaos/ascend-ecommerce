import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMemberThread } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireApprovedMember();

  if (user.role === "ADMIN") {
    redirect("/admin/messages");
  }

  const params = await searchParams;

  const threads = await prisma.messageThread.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
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

          <Link href="/account" className="member-header-link">
            Dashboard
          </Link>
        </header>

        <section className="member-account-hero member-message-hero">
          <div>
            <span className="admin-eyebrow">MEMBER SUPPORT</span>
            <h1>Messages</h1>
            <p>
              Private conversations between you and Ascend Support.
            </p>
          </div>
        </section>

        <div className="member-message-layout">
          <section className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">INBOX</span>
                <h2>Your Conversations</h2>
              </div>

              <MessageSquare size={19} />
            </div>

            <div className="member-thread-list">
              {threads.length === 0 ? (
                <div className="member-message-empty">
                  <MessageSquare size={22} />
                  <strong>No conversations yet</strong>
                  <span>
                    Start a conversation with Ascend Support.
                  </span>
                </div>
              ) : (
                threads.map((thread) => {
                  const latest = thread.messages[0];

                  return (
                    <Link
                      key={thread.id}
                      href={`/account/messages/${thread.id}`}
                      className="member-thread-row"
                    >
                      <div>
                        <strong>{thread.subject}</strong>
                        <span>
                          {latest
                            ? latest.body.length > 90
                              ? `${latest.body.slice(0, 90)}...`
                              : latest.body
                            : "No messages"}
                        </span>
                      </div>

                      <small>
                        {thread.status === "OPEN" ? "Open" : "Closed"}
                      </small>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">NEW MESSAGE</span>
                <h2>Contact Ascend Support</h2>
              </div>

              <Plus size={19} />
            </div>

            {params.error === "missing" && (
              <div className="member-profile-error">
                Enter a subject and message.
              </div>
            )}

            <form
              action={createMemberThread}
              className="member-new-message-form"
            >
              <label className="member-profile-field">
                <span>Subject</span>
                <input
                  name="subject"
                  maxLength={120}
                  required
                  placeholder="How can we help?"
                />
              </label>

              <label className="member-profile-field">
                <span>Message</span>
                <textarea
                  name="body"
                  required
                  rows={7}
                  placeholder="Write your message..."
                />
              </label>

              <button
                type="submit"
                className="member-primary-button"
              >
                Send Message
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}