"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function registerMember(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(
    formData.get("confirmPassword") ?? ""
  );

  const address1 = String(formData.get("address1") ?? "").trim();
  const address2 = String(formData.get("address2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !email ||
    !password ||
    !address1 ||
    !city ||
    !state ||
    !postalCode
  ) {
    redirect("/signup?error=missing");
  }

  if (password.length < 8) {
    redirect("/signup?error=password");
  }

  if (password !== confirmPassword) {
    redirect("/signup?error=confirm");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    redirect("/signup?error=exists");
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        passwordHash,

        role: "MEMBER",
        status: "PENDING",

        addresses: {
          create: {
            label: "Shipping",
            firstName,
            lastName,
            address1,
            address2: address2 || null,
            city,
            state,
            postalCode,
            country: "US",
            phone,
            isDefault: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Member registration failed:", error);
    redirect("/signup?error=failed");
  }

  redirect("/signup/success");
}