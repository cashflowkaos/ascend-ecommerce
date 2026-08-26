"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function registerMember(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const dateOfBirthValue = String(
    formData.get("dateOfBirth") ?? ""
  ).trim();

  const ageCertified =
    String(formData.get("ageCertified") ?? "") === "yes";

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
    !dateOfBirthValue ||
    !ageCertified ||
    !email ||
    !password ||
    !address1 ||
    !city ||
    !state ||
    !postalCode
  ) {
    redirect("/signup?error=missing");
  }

  const dateOfBirth = new Date(`${dateOfBirthValue}T00:00:00`);

  if (
    Number.isNaN(dateOfBirth.getTime()) ||
    dateOfBirth.toISOString().slice(0, 10) !== dateOfBirthValue
  ) {
    redirect("/signup?error=dob");
  }

  const today = new Date();

  const twentyFirstBirthday = new Date(
    dateOfBirth.getFullYear() + 21,
    dateOfBirth.getMonth(),
    dateOfBirth.getDate()
  );

  if (twentyFirstBirthday > today) {
    redirect("/signup?error=underage");
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

        dateOfBirth,
        ageCertifiedAt: new Date(),

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