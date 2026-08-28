"use client";

import {
  Megaphone,
  Send,
} from "lucide-react";
import { useState } from "react";
import { sendMemberBroadcast } from "@/app/admin/messages/actions";

export default function AdminBroadcastPanel({
  memberCount,
}: {
  memberCount: number;
}) {
  const [confirmed, setConfirmed] =
    useState(false);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-eyebrow">
            BROADCAST
          </span>

          <h2>Broadcast All Members</h2>

          <p>
            Send one announcement to every
            approved Ascend member.
          </p>
        </div>

        <Megaphone size={19} />
      </div>

      <div className="mb-6 rounded-[14px] border border-neutral-200 bg-neutral-50 p-4">
        <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Current Audience
        </span>

        <strong className="mt-1 block text-lg text-neutral-950">
          {memberCount} approved{" "}
          {memberCount === 1
            ? "member"
            : "members"}
        </strong>

        <span className="mt-1 block text-xs text-neutral-500">
          Each approved member receives this as
          a private message in their Ascend inbox
          and can reply directly.
        </span>
      </div>

      <form
        action={sendMemberBroadcast}
        className="admin-thread-reply"
      >
        <label className="member-profile-field">
          <span>Subject</span>

          <input
            type="text"
            name="subject"
            required
            maxLength={120}
            placeholder="Announcement subject"
          />
        </label>

        <label className="member-profile-field">
          <span>Message</span>

          <textarea
            name="body"
            required
            rows={8}
            placeholder="Write your announcement..."
          />
        </label>

        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-[14px] border border-neutral-200 bg-neutral-50 p-4">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) =>
              setConfirmed(event.target.checked)
            }
            className="mt-1"
          />

          <span className="text-sm leading-6 text-neutral-600">
            I understand this announcement will
            be sent to all{" "}
            <strong className="text-neutral-950">
              {memberCount} approved members
            </strong>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={
            !confirmed || memberCount === 0
          }
          className="admin-primary-button"
        >
          <Send size={14} />
          Send Broadcast
        </button>
      </form>
    </section>
  );
}
