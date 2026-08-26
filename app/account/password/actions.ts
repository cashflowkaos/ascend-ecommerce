"use server";

import { redirect } from "next/navigation";
import {
  destroyAllUserSessions,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function changeMemberPassword(formData: FormData) {
  const currentUser = await requireUser();

  if (currentUser.role === "ADMIN") {
    redirect("/admin");
  }

  const currentPassword = String(
    formData.get("currentPassword") ?? ""
  );

  const newPassword = String(
    formData.get("newPassword") ?? ""
  );

  const confirmPassword = String(
    formData.get("confirmPassword") ?? ""
  );

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/account/password?error=missing");
  }

  if (newPassword.length < 8) {
    redirect("/account/password?error=length");
  }

  if (newPassword !== confirmPassword) {
    redirect("/account/password?error=confirm");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  const currentPasswordValid = await verifyPassword(
    currentPassword,
    user.passwordHash
  );

  if (!currentPasswordValid) {
    redirect("/account/password?error=current");
  }

  const samePassword = await verifyPassword(
    newPassword,
    user.passwordHash
  );

  if (samePassword) {
    redirect("/account/password?error=same");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  await destroyAllUserSessions(user.id);

  redirect("/signin?passwordChanged=1");
}