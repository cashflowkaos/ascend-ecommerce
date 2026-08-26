"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewMessageNotificationEmail } from "@/lib/email";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function replyAdminThread(formData: FormData) {
  const admin = await requireAdmin();

  const threadId = clean(formData.get("threadId"));
  const body = clean(formData.get("body"));

  if (!threadId || !body) {
    redirect("/admin/messages");
  }

  const thread = await prisma.messageThread.findUnique({
    where: {
      id: threadId,
    },
    include: {
      user: true,
    },
  });

  if (!thread) {
    redirect("/admin/messages");
  }

  await prisma.message.create({
    data: {
      threadId,
      senderId: admin.id,
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
    console.log(
      "MESSAGE EMAIL: attempting delivery to",
      thread.user.email
    );

    const emailResult = await sendNewMessageNotificationEmail({
      email: thread.user.email,
      firstName: thread.user.firstName,
    });

    console.log(
      "MESSAGE EMAIL: SUCCESS",
      emailResult
    );
  } catch (error) {
    console.error(
      "MESSAGE EMAIL: FAILED",
      error
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${threadId}`);
  revalidatePath("/account");
  revalidatePath("/account/messages");
  revalidatePath(`/account/messages/${threadId}`);

  redirect(`/admin/messages/${threadId}`);
}