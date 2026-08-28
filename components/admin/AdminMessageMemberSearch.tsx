"use client";

import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { createAdminThread } from "@/app/admin/messages/actions";

type ThreadResult = {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
  latestMessage: string | null;
};

type MemberResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  threads: ThreadResult[];
};

export default function AdminMessageMemberSearch() {
  const [query, setQuery] = useState("");
  const [members, setMembers] =
    useState<MemberResult[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<MemberResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [composing, setComposing] =
    useState(false);

  useEffect(() => {
    const search = query.trim();

    if (
      search.length < 2 ||
      selectedMember
    ) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(
      async () => {
        setLoading(true);

        try {
          const response = await fetch(
            `/api/admin/members/message-search?q=${encodeURIComponent(
              search
            )}`,
            {
              signal: controller.signal,
              cache: "no-store",
            }
          );

          if (!response.ok) {
            setMembers([]);
            return;
          }

          const data = (await response.json()) as {
            members?: MemberResult[];
          };

          setMembers(
            Array.isArray(data.members)
              ? data.members
              : []
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.name !== "AbortError"
          ) {
            setMembers([]);
          }
        } finally {
          setLoading(false);
        }
      },
      250
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedMember]);

  function selectMember(member: MemberResult) {
    setSelectedMember(member);
    setMembers([]);
    setQuery("");
    setComposing(false);
  }

  function clearMember() {
    setSelectedMember(null);
    setMembers([]);
    setQuery("");
    setComposing(false);
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-eyebrow">
            MEMBER LOOKUP
          </span>

          <h2>Find Member or Conversation</h2>

          <p>
            Search by member name, email, or
            conversation subject.
          </p>
        </div>

        <Search size={19} />
      </div>

      {!selectedMember ? (
        <>
          <label className="member-profile-field">
            <span>Search</span>

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Start typing a member or conversation..."
              autoComplete="off"
            />
          </label>

          {query.trim().length === 1 && (
            <p className="mt-2 text-xs text-neutral-400">
              Type at least 2 characters.
            </p>
          )}

          {query.trim().length >= 2 && (
            <div className="mt-4 overflow-hidden rounded-[14px] border border-neutral-200 bg-white">
              {loading ? (
                <div className="p-4 text-sm text-neutral-500">
                  Searching...
                </div>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      selectMember(member)
                    }
                    className="flex w-full items-center justify-between gap-4 border-b border-neutral-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-neutral-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <UserRound size={16} />
                      </div>

                      <div className="min-w-0">
                        <strong className="block truncate text-sm text-neutral-950">
                          {member.firstName}{" "}
                          {member.lastName}
                        </strong>

                        <span className="block truncate text-xs text-neutral-500">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs text-neutral-400">
                      {member.threads.length}{" "}
                      {member.threads.length === 1
                        ? "conversation"
                        : "conversations"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-sm text-neutral-500">
                  No approved members or conversations found.
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                <UserRound size={17} />
              </div>

              <div className="min-w-0">
                <strong className="block truncate text-sm text-neutral-950">
                  {selectedMember.firstName}{" "}
                  {selectedMember.lastName}
                </strong>

                <span className="block truncate text-xs text-neutral-500">
                  {selectedMember.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={clearMember}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-100"
              aria-label="Choose another member"
              title="Choose another member"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <span className="admin-eyebrow">
                CONVERSATION HISTORY
              </span>

              <h3 className="mt-1 text-lg font-semibold">
                Existing Conversations
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setComposing((value) => !value)
              }
              className="admin-primary-button"
            >
              <Plus size={14} />
              New Conversation
            </button>
          </div>

          <div className="admin-message-list mt-4">
            {selectedMember.threads.length === 0 ? (
              <div className="admin-message-empty">
                No previous conversations with this member.
              </div>
            ) : (
              selectedMember.threads.map(
                (thread) => (
                  <Link
                    key={thread.id}
                    href={`/admin/messages/${thread.id}`}
                    className="admin-message-row"
                  >
                    <div className="admin-message-member">
                      <strong>
                        {thread.subject}
                      </strong>

                      <span>
                        {new Date(
                          thread.updatedAt
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    <div className="admin-message-preview">
                      <strong>
                        Open Conversation
                      </strong>

                      <span>
                        {thread.latestMessage
                          ? thread.latestMessage
                              .length > 100
                            ? `${thread.latestMessage.slice(
                                0,
                                100
                              )}...`
                            : thread.latestMessage
                          : "No messages"}
                      </span>
                    </div>

                    <div className="admin-message-status">
                      <small>
                        {thread.status}
                      </small>
                    </div>
                  </Link>
                )
              )
            )}
          </div>

          {composing && (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <div className="mb-5">
                <span className="admin-eyebrow">
                  NEW CONVERSATION
                </span>

                <h3 className="mt-1 text-lg font-semibold">
                  Message{" "}
                  {selectedMember.firstName}
                </h3>
              </div>

              <form
                action={createAdminThread}
                className="admin-thread-reply"
              >
                <input
                  type="hidden"
                  name="userId"
                  value={selectedMember.id}
                />

                <label className="member-profile-field">
                  <span>Subject</span>

                  <input
                    type="text"
                    name="subject"
                    required
                    maxLength={120}
                    placeholder="Message subject"
                  />
                </label>

                <label className="member-profile-field">
                  <span>Message</span>

                  <textarea
                    name="body"
                    rows={7}
                    required
                    placeholder="Write your message..."
                  />
                </label>

                <button
                  type="submit"
                  className="admin-primary-button"
                >
                  <MessageSquare size={14} />
                  Send Message
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

