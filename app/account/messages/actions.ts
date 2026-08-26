"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createMemberThread(formData: FormData) {
  const user = await requireApprovedMember();

  if (user.role === "ADMIN") {
    redirect("/admin/messages");
  }

  const subject = clean(formData.get("subject"));
  const body = clean(formData.get("body"));

  if (!subject || !body) {
    redirect("/account/messages?error=missing");
  }

  const thread = await prisma.messageThread.create({
    data: {
      userId: user.id,
      subject,
      messages: {
        create: {
          senderId: user.id,
          body,
        },
      },
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/messages");
  revalidatePath("/admin");
  revalidatePath("/admin/messages");

  redirect(`/account/messages/${thread.id}`);
}

export async function replyMemberThread(formData: FormData) {
  const user = await requireApprovedMember();

  if (user.role === "ADMIN") {
    redirect("/admin/messages");
  }

  const threadId = clean(formData.get("threadId"));
  const body = clean(formData.get("body"));

  if (!threadId || !body) {
    redirect("/account/messages");
  }

  const thread = await prisma.messageThread.findFirst({
    where: {
      id: threadId,
      userId: user.id,
    },
  });

  if (!thread) {
    redirect("/account/messages");
  }

  await prisma.message.create({
    data: {
      threadId,
      senderId: user.id,
      body,
    },
  });

  if (thread.status !== "OPEN") {
    await prisma.messageThread.update({
      where: {
        id: threadId,
      },
      data: {
        status: "OPEN",
      },
    });
  }

  revalidatePath("/account");
  revalidatePath("/account/messages");
  revalidatePath(`/account/messages/${threadId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/messages");

  redirect(`/account/messages/${threadId}`);
}