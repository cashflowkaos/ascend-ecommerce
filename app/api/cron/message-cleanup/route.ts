import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessageRetentionCutoff } from "@/lib/message-retention";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader =
    request.headers.get("authorization");

  const cronSecret =
    process.env.CRON_SECRET;

  if (
    !cronSecret ||
    authHeader !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  const cutoff =
    getMessageRetentionCutoff();

  const [threads, broadcasts] =
    await prisma.$transaction([
      prisma.messageThread.deleteMany({
        where: {
          updatedAt: {
            lt: cutoff,
          },
        },
      }),

      prisma.messageBroadcast.deleteMany({
        where: {
          createdAt: {
            lt: cutoff,
          },
        },
      }),
    ]);

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    deleted: {
      threads: threads.count,
      broadcasts: broadcasts.count,
    },
  });
}
