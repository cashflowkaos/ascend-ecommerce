"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewMessageNotificationEmail } from "@/lib/email";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createAdminThread(formData: FormData) {
  const admin = await requireAdmin();

  const userId = clean(formData.get("userId"));
  const subject = clean(formData.get("subject"));
  const body = clean(formData.get("body"));

  if (!userId || !subject || !body) {
    redirect("/admin/messages/new?error=missing");
  }

  const member = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "MEMBER",
      status: "APPROVED",
    },
    select: {
      id: true,
      firstName: true,
      email: true,
    },
  });

  if (!member) {
    redirect("/admin/messages/new?error=member");
  }

  const thread = await prisma.messageThread.create({
    data: {
      userId: member.id,
      subject,
      status: "OPEN",
      messages: {
        create: {
          senderId: admin.id,
          body,
        },
      },
    },
    select: {
      id: true,
    },
  });

  try {
    await sendNewMessageNotificationEmail({
      email: member.email,
      firstName: member.firstName,
    });
  } catch (error) {
    console.error(
      "NEW ADMIN MESSAGE EMAIL: FAILED",
      error
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  revalidatePath("/account");
  revalidatePath("/account/messages");

  redirect(`/admin/messages/${thread.id}`);
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

export async function sendMemberBroadcast(formData: FormData) {
  const admin = await requireAdmin();

  const subject = clean(formData.get("subject"));
  const body = clean(formData.get("body"));

  if (!subject || !body) {
    redirect(
      "/admin/messages/new?broadcastError=missing"
    );
  }

  if (subject.length > 120) {
    redirect(
      "/admin/messages/new?broadcastError=subject"
    );
  }

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      status: "APPROVED",
    },
    orderBy: [
      {
        lastName: "asc",
      },
      {
        firstName: "asc",
      },
    ],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (members.length === 0) {
    redirect(
      "/admin/messages/new?broadcastError=no-members"
    );
  }

  const adminName =
    `${admin.firstName} ${admin.lastName}`.trim();

  const broadcast =
    await prisma.messageBroadcast.create({
      data: {
        subject,
        body,
        recipientCount: members.length,
        sentById: admin.id,
        sentByName: adminName || "Ascend Admin",
        sentByEmail: admin.email,
      },
      select: {
        id: true,
      },
    });

  let emailSuccessCount = 0;
  let emailFailureCount = 0;

  for (const member of members) {
    await prisma.messageThread.create({
      data: {
        userId: member.id,
        subject,
        status: "OPEN",
        messages: {
          create: {
            senderId: admin.id,
            body,
          },
        },
      },
    });

    try {
      await sendNewMessageNotificationEmail({
        email: member.email,
        firstName: member.firstName,
      });

      emailSuccessCount++;
    } catch (error) {
      emailFailureCount++;

      console.error(
        `BROADCAST EMAIL FAILED: ${member.email}`,
        error
      );
    }
  }

  await prisma.messageBroadcast.update({
    where: {
      id: broadcast.id,
    },
    data: {
      emailSuccessCount,
      emailFailureCount,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/messages/new");
  revalidatePath("/account");
  revalidatePath("/account/messages");

  redirect(
    `/admin/messages/new?broadcast=sent&recipients=${members.length}&success=${emailSuccessCount}&failed=${emailFailureCount}`
  );
}
