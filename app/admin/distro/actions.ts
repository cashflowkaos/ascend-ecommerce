"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function calculatedPrice(
  cost: number | null,
  markup: number
) {
  if (cost === null) return null;
  return Math.ceil(cost * markup).toFixed(2);
}

export async function updateDistroSettings(
  formData: FormData
) {
  await requireAdmin();

  const backOfficeProductId = text(
    formData,
    "backOfficeProductId"
  );

  if (!backOfficeProductId) {
    throw new Error(
      "Back Office product ID is required."
    );
  }

  const enabled =
    formData.get("enabled") === "on";

  const available =
    formData.get("available") === "on";

  const product =
    await prisma.backOfficeProduct.findUnique({
      where: {
        id: backOfficeProductId,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        cost: true,
        distroProduct: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!product) {
    throw new Error(
      "Back Office product not found."
    );
  }

  const cost =
    product.cost === null
      ? null
      : Number(product.cost);

  const legacyData = {
    sku: product.sku,
    name: product.name,
    description: product.description,
    cost:
      cost === null
        ? null
        : cost.toFixed(2),
    tier1Price: calculatedPrice(cost, 1.4),
    tier2Price: calculatedPrice(cost, 1.35),
    tier3Price: calculatedPrice(cost, 1.3),
    enabled,
    available,
  };

  if (product.distroProduct) {
    await prisma.distroProduct.update({
      where: {
        id: product.distroProduct.id,
      },
      data: legacyData,
    });
  } else {
    const legacyBySku =
      await prisma.distroProduct.findUnique({
        where: {
          sku: product.sku,
        },
        select: {
          id: true,
          backOfficeProductId: true,
        },
      });

    if (
      legacyBySku?.backOfficeProductId &&
      legacyBySku.backOfficeProductId !==
        product.id
    ) {
      throw new Error(
        "This Distro SKU is already linked to another Back Office product."
      );
    }

    if (legacyBySku) {
      await prisma.distroProduct.update({
        where: {
          id: legacyBySku.id,
        },
        data: {
          ...legacyData,
          backOfficeProductId: product.id,
        },
      });
    } else {
      const lastProduct =
        await prisma.distroProduct.findFirst({
          orderBy: {
            sortOrder: "desc",
          },
          select: {
            sortOrder: true,
          },
        });

      await prisma.distroProduct.create({
        data: {
          ...legacyData,
          inventoryQty: 0,
          sortOrder:
            (lastProduct?.sortOrder ?? -1) + 1,
          backOfficeProductId: product.id,
        },
      });
    }
  }

  revalidatePath("/admin/distro");
  revalidatePath("/distro");
}
