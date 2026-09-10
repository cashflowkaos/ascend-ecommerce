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

  const messages =
    await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

  const emptyThreads =
    await prisma.messageThread.deleteMany({
      where: {
        messages: {
          none: {},
        },
      },
    });

  const broadcastCutoff = new Date();
  broadcastCutoff.setDate(
    broadcastCutoff.getDate() - 14
  );

  const broadcasts =
    await prisma.messageBroadcast.deleteMany({
      where: {
        createdAt: {
          lt: broadcastCutoff,
        },
      },
    });

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    deleted: {
      messages: messages.count,
      emptyThreads: emptyThreads.count,
      broadcasts: broadcasts.count,
    },
  });
}
