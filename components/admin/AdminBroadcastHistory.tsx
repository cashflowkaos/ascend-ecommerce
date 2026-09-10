import {
  History,
  Users,
} from "lucide-react";

type Broadcast = {
  id: string;
  recipientCount: number;

  sentByName: string;
  createdAt: Date;
};

export default function AdminBroadcastHistory({
  broadcasts,
}: {
  broadcasts: Broadcast[];
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-eyebrow">
            HISTORY
          </span>

          <h2>Broadcast History</h2>

          <p>
            Recently sent member broadcasts.
          </p>
        </div>

        <History size={19} />
      </div>

      {broadcasts.length === 0 ? (
        <div className="admin-message-empty">
          No broadcasts have been sent yet.
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((broadcast) => {
return (
              <div
                key={broadcast.id}
                className="rounded-[14px] border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <strong className="block text-sm text-neutral-950">
                      Member Broadcast
                    </strong>

                    <span className="mt-1 block text-xs text-neutral-400">
                      {new Intl.DateTimeFormat(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      ).format(
                        broadcast.createdAt
                      )}
                      {" · "}
                      {broadcast.sentByName}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} />
                      {broadcast.recipientCount} member inboxes
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
