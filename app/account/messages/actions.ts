"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewAdminMessageNotificationEmail } from "@/lib/email";
import { getOrCreateMemberMessageThread } from "@/lib/member-message-thread";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createMemberThread(formData: FormData) {
  const user = await requireApprovedMember();

  if (user.role === "ADMIN") {
    redirect("/admin/messages");
  }

  const body = clean(formData.get("body"));

  if (!body) {
    redirect("/account/messages?error=missing");
  }

  const thread =
    await getOrCreateMemberMessageThread(user.id);

  await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: user.id,
      body,
    },
  });

  try {
    await sendNewAdminMessageNotificationEmail();
  } catch (error) {
    console.error(
      "ADMIN MESSAGE EMAIL: FAILED",
      error
    );
  }

  revalidatePath("/account");
  revalidatePath("/account/messages");
  revalidatePath(`/account/messages/${thread.id}`);
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
    select: {
      id: true,
      status: true,
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

  try {
    await sendNewAdminMessageNotificationEmail();
  } catch (error) {
    console.error(
      "ADMIN MESSAGE EMAIL: FAILED",
      error
    );
  }

  revalidatePath("/account");
  revalidatePath("/account/messages");
  revalidatePath(`/account/messages/${threadId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/messages");

  redirect(`/account/messages/${threadId}`);
}
