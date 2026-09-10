import { prisma } from "@/lib/prisma";

export async function getOrCreateMemberMessageThread(
  userId: string
) {
  const existing =
    await prisma.messageThread.findFirst({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (existing) {
    if (existing.status !== "OPEN") {
      await prisma.messageThread.update({
        where: {
          id: existing.id,
        },
        data: {
          status: "OPEN",
        },
      });
    }

    return {
      id: existing.id,
    };
  }

  return prisma.messageThread.create({
    data: {
      userId,
      subject: "Ascend Support",
      status: "OPEN",
    },
    select: {
      id: true,
    },
  });
}
