import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const q = String(
    searchParams.get("q") ?? ""
  ).trim();

  if (q.length < 2) {
    return NextResponse.json({
      members: [],
    });
  }

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      status: "APPROVED",
      OR: [
        {
          firstName: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    },

    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],

    take: 20,

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,

      messageThreads: {
        orderBy: {
          updatedAt: "desc",
        },

        take: 1,

        select: {
          id: true,
          status: true,
          updatedAt: true,

          messages: {
            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              body: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,

      threads: member.messageThreads.map(
        (thread) => ({
          id: thread.id,
          status: thread.status,
          updatedAt: thread.updatedAt,
          latestMessage:
            thread.messages[0]?.body ?? null,
        })
      ),
    })),
  });
}
