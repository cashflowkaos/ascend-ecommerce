"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signin?error=missing");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    redirect("/signin?error=invalid");
  }

  const passwordValid = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    redirect("/signin?error=invalid");
  }

  if (user.status === "DISABLED") {
    redirect("/signin?error=disabled");
  }

  if (user.status === "DECLINED") {
    redirect("/signin?error=declined");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  await createSession(user.id);

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.mustChangePassword) {
    redirect("/account/password");
  }

  redirect("/account");
}