import { prisma } from "@/lib/prisma";

export async function getOrCreateMemberMessageThread(
  userId: string
) {
  return prisma.messageThread.upsert({
    where: {
      userId,
    },
    update: {
      status: "OPEN",
    },
    create: {
      userId,
      subject: "Ascend Support",
      status: "OPEN",
    },
    select: {
      id: true,
    },
  });
}
