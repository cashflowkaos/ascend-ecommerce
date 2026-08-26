"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  destroyAllUserSessions,
  hashPassword,
  requireAdmin,
} from "@/lib/auth";
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


export async function updateMemberAccount(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!id || !firstName || !lastName || !email) {
    throw new Error(
      "Member ID, first name, last name, and email are required."
    );
  }

  const member = await prisma.user.findFirst({
    where: {
      id,
      role: "MEMBER",
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!member) {
    throw new Error("Member not found.");
  }

  const duplicateEmail = await prisma.user.findFirst({
    where: {
      email,
      id: {
        not: id,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicateEmail) {
    throw new Error(
      "That email address is already assigned to another account."
    );
  }

  const emailChanged =
    member.email.toLowerCase() !== email;

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
    },
  });

  if (emailChanged) {
    await destroyAllUserSessions(id);
  }

  revalidateMemberPages(id);
  revalidatePath("/admin/messages");
  revalidatePath("/account");
}

export async function resetMemberPassword(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const temporaryPassword = String(
    formData.get("temporaryPassword") ?? ""
  );

  if (!id) {
    throw new Error("Member ID is required.");
  }

  if (temporaryPassword.length < 8) {
    throw new Error(
      "Temporary password must be at least 8 characters."
    );
  }

  await getMember(id);

  const passwordHash = await hashPassword(
    temporaryPassword
  );

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  await destroyAllUserSessions(id);

  revalidateMemberPages(id);
}
