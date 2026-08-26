"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  sendMemberApprovalEmail,
  sendMemberDeclinedEmail,
} from "@/lib/email";

async function getMember(id: string) {
  const member = await prisma.user.findFirst({
    where: {
      id,
      role: "MEMBER",
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      status: true,
    },
  });

  if (!member) {
    throw new Error("Member not found.");
  }

  return member;
}

function revalidateMemberPages(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

export async function approveMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Member ID is required.");
  }

  const member = await getMember(id);

  await prisma.user.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      disabledAt: null,
    },
  });

  try {
    await sendMemberApprovalEmail({
      email: member.email,
      firstName: member.firstName,
    });
  } catch (error) {
    console.error(
      `Approval email failed for member ${member.id}:`,
      error
    );
  }

  revalidateMemberPages(id);
}

export async function declineMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Member ID is required.");
  }

  const member = await getMember(id);

  await prisma.user.update({
    where: { id },
    data: {
      status: "DECLINED",
      approvedAt: null,
      disabledAt: null,
    },
  });

  try {
    await sendMemberDeclinedEmail({
      email: member.email,
      firstName: member.firstName,
    });
  } catch (error) {
    console.error(
      `Decline email failed for member ${member.id}:`,
      error
    );
  }

  revalidateMemberPages(id);
}

export async function disableMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Member ID is required.");
  }

  await getMember(id);

  await prisma.user.update({
    where: { id },
    data: {
      status: "DISABLED",
      disabledAt: new Date(),
    },
  });

  revalidateMemberPages(id);
}
