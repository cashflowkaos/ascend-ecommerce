"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function saveMemberProfile(formData: FormData) {
  const currentUser = await requireUser();

  if (currentUser.role === "ADMIN") {
    redirect("/admin");
  }

  if (currentUser.mustChangePassword) {
    redirect("/account/password");
  }

  const firstName = clean(formData.get("firstName"));
  const lastName = clean(formData.get("lastName"));
  const phone = clean(formData.get("phone"));

  const addressFirstName = clean(formData.get("addressFirstName"));
  const addressLastName = clean(formData.get("addressLastName"));
  const company = clean(formData.get("company"));
  const address1 = clean(formData.get("address1"));
  const address2 = clean(formData.get("address2"));
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state"));
  const postalCode = clean(formData.get("postalCode"));
  const addressPhone = clean(formData.get("addressPhone"));

  if (!firstName || !lastName) {
    redirect("/account/profile?error=name");
  }

  const hasAnyAddress =
    addressFirstName ||
    addressLastName ||
    company ||
    address1 ||
    address2 ||
    city ||
    state ||
    postalCode ||
    addressPhone;

  if (
    hasAnyAddress &&
    (!addressFirstName ||
      !addressLastName ||
      !address1 ||
      !city ||
      !state ||
      !postalCode)
  ) {
    redirect("/account/profile?error=address");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        firstName,
        lastName,
        phone: phone || null,
      },
    });

    if (hasAnyAddress) {
      const existingDefault = await tx.address.findFirst({
        where: {
          userId: currentUser.id,
          isDefault: true,
        },
      });

      const existingAddress =
        existingDefault ??
        (await tx.address.findFirst({
          where: {
            userId: currentUser.id,
          },
          orderBy: {
            createdAt: "asc",
          },
        }));

      await tx.address.updateMany({
        where: {
          userId: currentUser.id,
        },
        data: {
          isDefault: false,
        },
      });

      const addressData = {
        label: "Shipping",
        firstName: addressFirstName,
        lastName: addressLastName,
        company: company || null,
        address1,
        address2: address2 || null,
        city,
        state,
        postalCode,
        country: "US",
        phone: addressPhone || null,
        isDefault: true,
      };

      if (existingAddress) {
        await tx.address.update({
          where: {
            id: existingAddress.id,
          },
          data: addressData,
        });
      } else {
        await tx.address.create({
          data: {
            userId: currentUser.id,
            ...addressData,
          },
        });
      }
    }
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");

  redirect("/account/profile?saved=1");
}