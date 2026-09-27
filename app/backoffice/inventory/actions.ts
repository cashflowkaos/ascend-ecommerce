"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";


export async function recordPhysicalInventoryCount(
  formData: FormData
) {
  const user = await requireAdmin();

  const batchId = String(
    formData.get("batchId") ?? ""
  ).trim();

  const locationId = String(
    formData.get("locationId") ?? ""
  ).trim();

  const rawQuantity = String(
    formData.get("quantity") ?? ""
  ).trim();

  const note = String(
    formData.get("note") ?? ""
  ).trim();

  if (!batchId || !locationId) {
    throw new Error(
      "Batch and location are required."
    );
  }

  const quantity = Number(rawQuantity);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    throw new Error(
      "Physical count must be a non-negative whole number."
    );
  }

  if (!note) {
    throw new Error(
      "A note is required for every physical inventory count."
    );
  }

  const createdByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  await prisma.$transaction(async (tx) => {
    const [batch, location] = await Promise.all([
      tx.backOfficeBatch.findUnique({
        where: { id: batchId },
        select: { id: true },
      }),

      tx.backOfficeLocation.findUnique({
        where: { id: locationId },
        select: {
          id: true,
          active: true,
        },
      }),
    ]);

    if (!batch) {
      throw new Error("Batch not found.");
    }

    if (!location || !location.active) {
      throw new Error(
        "Inventory location not found or inactive."
      );
    }

    const existingBalance =
      await tx.backOfficeInventoryBalance.findUnique({
        where: {
          batchId_locationId: {
            batchId,
            locationId,
          },
        },
        select: {
          id: true,
          quantity: true,
        },
      });

    const quantityBefore =
      existingBalance?.quantity ?? 0;

    const quantityDelta =
      quantity - quantityBefore;

    if (existingBalance) {
      await tx.backOfficeInventoryBalance.update({
        where: {
          id: existingBalance.id,
        },
        data: {
          quantity,
        },
      });
    } else {
      await tx.backOfficeInventoryBalance.create({
        data: {
          batchId,
          locationId,
          quantity,
        },
      });
    }

    await tx.backOfficeInventoryMovement.create({
      data: {
        batchId,
        locationId,
        type: "ADJUSTMENT",
        quantityDelta,
        quantityBefore,
        quantityAfter: quantity,
        referenceType: "INVENTORY_AUDIT",
        note,
        createdById: user.id,
        createdByName,
      },
    });
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath("/backoffice/inventory/count");
}

export async function adjustBackOfficeInventory(
  formData: FormData
) {
  const user = await requireAdmin();

  const batchId = String(
    formData.get("batchId") ?? ""
  ).trim();

  const locationId = String(
    formData.get("locationId") ?? ""
  ).trim();

  const rawAdjustment = String(
    formData.get("adjustment") ?? ""
  ).trim();

  const note = String(
    formData.get("note") ?? ""
  ).trim();

  const adjustment = Number(rawAdjustment);

  if (!batchId || !locationId) {
    throw new Error(
      "Batch and location are required."
    );
  }

  if (
    !Number.isInteger(adjustment) ||
    adjustment === 0
  ) {
    throw new Error(
      "Adjustment must be a non-zero whole number."
    );
  }

  if (!note) {
    throw new Error(
      "A reason for the adjustment is required."
    );
  }

  const createdByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  await prisma.$transaction(async (tx) => {
    const [batch, location] =
      await Promise.all([
        tx.backOfficeBatch.findUnique({
          where: { id: batchId },
          select: { id: true },
        }),

        tx.backOfficeLocation.findUnique({
          where: { id: locationId },
          select: {
            id: true,
            active: true,
          },
        }),
      ]);

    if (!batch) {
      throw new Error("Batch not found.");
    }

    if (!location || !location.active) {
      throw new Error(
        "Inventory location not found or inactive."
      );
    }

    const balance =
      await tx.backOfficeInventoryBalance.findUnique({
        where: {
          batchId_locationId: {
            batchId,
            locationId,
          },
        },
        select: {
          id: true,
          quantity: true,
        },
      });

    const quantityBefore =
      balance?.quantity ?? 0;

    const quantityAfter =
      quantityBefore + adjustment;

    if (quantityAfter < 0) {
      throw new Error(
        "Adjustment cannot make inventory negative."
      );
    }

    if (balance) {
      await tx.backOfficeInventoryBalance.update({
        where: {
          id: balance.id,
        },
        data: {
          quantity: quantityAfter,
        },
      });
    } else {
      await tx.backOfficeInventoryBalance.create({
        data: {
          batchId,
          locationId,
          quantity: quantityAfter,
        },
      });
    }

    await tx.backOfficeInventoryMovement.create({
      data: {
        batchId,
        locationId,
        type: "ADJUSTMENT",
        quantityDelta: adjustment,
        quantityBefore,
        quantityAfter,
        referenceType: "MANUAL_ADJUSTMENT",
        note,
        createdById: user.id,
        createdByName,
      },
    });
  });

  revalidatePath("/backoffice/inventory");
}
export async function createBackOfficeProduct(
  formData: FormData
) {
  await requireAdmin();

  const sku = String(
    formData.get("sku") ?? ""
  ).trim().toUpperCase();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const batchNumber = String(
    formData.get("batchNumber") ?? ""
  ).trim();

  const unitsPerKit = Number(
    formData.get("unitsPerKit") ?? 10
  );

  if (!sku) {
    throw new Error("SKU is required.");
  }

  if (!name) {
    throw new Error("Product name is required.");
  }

  if (
    !Number.isInteger(unitsPerKit) ||
    unitsPerKit < 1
  ) {
    throw new Error(
      "Vials per kit must be a whole number greater than zero."
    );
  }

  const existing =
    await prisma.backOfficeProduct.findUnique({
      where: { sku },
      select: { id: true },
    });

  if (existing) {
    throw new Error(
      "A Back Office product with this SKU already exists."
    );
  }

  await prisma.$transaction(async (tx) => {
    const product =
      await tx.backOfficeProduct.create({
        data: {
          sku,
          name,
          description,
          unitsPerKit,
        },
      });

    if (batchNumber) {
      await tx.backOfficeBatch.create({
        data: {
          productId: product.id,
          batchNumber,
        },
      });
    }
  });

  revalidatePath("/backoffice/inventory");
  redirect("/backoffice/inventory");
}

export async function updateBackOfficeProduct(
  formData: FormData
) {
  await requireAdmin();

  const id = String(
    formData.get("id") ?? ""
  ).trim();

  const sku = String(
    formData.get("sku") ?? ""
  ).trim().toUpperCase();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const unitsPerKit = Number(
    formData.get("unitsPerKit") ?? 10
  );

  if (!id) {
    throw new Error("Product ID is required.");
  }

  if (!sku) {
    throw new Error("SKU is required.");
  }

  if (!name) {
    throw new Error("Product name is required.");
  }

  if (
    !Number.isInteger(unitsPerKit) ||
    unitsPerKit < 1
  ) {
    throw new Error(
      "Vials per kit must be a whole number greater than zero."
    );
  }

  const product =
    await prisma.backOfficeProduct.findUnique({
      where: { id },
      select: { id: true },
    });

  if (!product) {
    throw new Error("Product not found.");
  }

  const duplicateSku =
    await prisma.backOfficeProduct.findFirst({
      where: {
        sku,
        NOT: { id },
      },
      select: { id: true },
    });

  if (duplicateSku) {
    throw new Error(
      "Another Back Office product already uses this SKU."
    );
  }

  await prisma.backOfficeProduct.update({
    where: { id },
    data: {
      sku,
      name,
      description,
      unitsPerKit,
    },
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath(`/backoffice/inventory/${id}`);

  redirect("/backoffice/inventory");
}

export async function addBackOfficeBatch(
  formData: FormData
) {
  await requireAdmin();

  const productId = String(
    formData.get("productId") ?? ""
  ).trim();

  const batchNumber = String(
    formData.get("batchNumber") ?? ""
  ).trim();

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  if (!batchNumber) {
    throw new Error("Batch number is required.");
  }

  const product =
    await prisma.backOfficeProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });

  if (!product) {
    throw new Error("Product not found.");
  }

  const existingBatch =
    await prisma.backOfficeBatch.findUnique({
      where: {
        productId_batchNumber: {
          productId,
          batchNumber,
        },
      },
      select: { id: true },
    });

  if (existingBatch) {
    throw new Error(
      "This batch number already exists for this product."
    );
  }

  await prisma.backOfficeBatch.create({
    data: {
      productId,
      batchNumber,
      receivedAt: new Date(),
    },
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath(
    `/backoffice/inventory/${productId}`
  );

  redirect(
    `/backoffice/inventory/${productId}`
  );
}

export async function setBackOfficeBatchStatus(
  formData: FormData
) {
  await requireAdmin();

  const batchId = String(
    formData.get("batchId") ?? ""
  ).trim();

  const productId = String(
    formData.get("productId") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? ""
  ).trim();

  if (!batchId || !productId) {
    throw new Error(
      "Batch and product are required."
    );
  }

  if (
    status !== "ACTIVE" &&
    status !== "RETIRED"
  ) {
    throw new Error("Invalid batch status.");
  }

  const batch =
    await prisma.backOfficeBatch.findFirst({
      where: {
        id: batchId,
        productId,
      },
      select: {
        id: true,
      },
    });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  await prisma.backOfficeBatch.update({
    where: {
      id: batchId,
    },
    data: {
      status,
      retiredAt:
        status === "RETIRED"
          ? new Date()
          : null,
    },
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath(
    `/backoffice/inventory/${productId}`
  );

  redirect(
    `/backoffice/inventory/${productId}`
  );
}

export async function saveBackOfficeBatchCoa(
  formData: FormData
) {
  await requireAdmin();

  const batchId = String(
    formData.get("batchId") ?? ""
  ).trim();

  const productId = String(
    formData.get("productId") ?? ""
  ).trim();

  const coaUrl = String(
    formData.get("coaUrl") ?? ""
  ).trim();

  if (!batchId || !productId) {
    throw new Error(
      "Batch and product are required."
    );
  }

  if (!coaUrl) {
    throw new Error("COA URL is required.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(coaUrl);
  } catch {
    throw new Error("Invalid COA URL.");
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:"
  ) {
    throw new Error("Invalid COA URL.");
  }

  const batch =
    await prisma.backOfficeBatch.findFirst({
      where: {
        id: batchId,
        productId,
      },
      select: {
        id: true,
      },
    });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  await prisma.backOfficeBatch.update({
    where: {
      id: batchId,
    },
    data: {
      coaUrl,
      coaUploadedAt: new Date(),
    },
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath(
    `/backoffice/inventory/${productId}`
  );
}

export async function removeBackOfficeBatchCoa(
  formData: FormData
) {
  await requireAdmin();

  const batchId = String(
    formData.get("batchId") ?? ""
  ).trim();

  const productId = String(
    formData.get("productId") ?? ""
  ).trim();

  if (!batchId || !productId) {
    throw new Error(
      "Batch and product are required."
    );
  }

  const batch =
    await prisma.backOfficeBatch.findFirst({
      where: {
        id: batchId,
        productId,
      },
      select: {
        id: true,
      },
    });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  await prisma.backOfficeBatch.update({
    where: {
      id: batchId,
    },
    data: {
      coaUrl: null,
      coaUploadedAt: null,
    },
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath(
    `/backoffice/inventory/${productId}`
  );
}

export async function transferBackOfficeInventory(
  formData: FormData
) {
  const user = await requireAdmin();

  const batchId = String(
    formData.get("batchId") ?? ""
  ).trim();

  const fromLocationId = String(
    formData.get("fromLocationId") ?? ""
  ).trim();

  const toLocationId = String(
    formData.get("toLocationId") ?? ""
  ).trim();

  const rawQuantity = String(
    formData.get("quantity") ?? ""
  ).trim();

  const note = String(
    formData.get("note") ?? ""
  ).trim();

  if (
    !batchId ||
    !fromLocationId ||
    !toLocationId
  ) {
    throw new Error(
      "Batch, source location, and destination location are required."
    );
  }

  if (fromLocationId === toLocationId) {
    throw new Error(
      "Source and destination locations must be different."
    );
  }

  const quantity = Number(rawQuantity);

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "Transfer quantity must be a positive whole number."
    );
  }

  const createdByName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  await prisma.$transaction(async (tx) => {
    const [batch, fromLocation, toLocation] =
      await Promise.all([
        tx.backOfficeBatch.findUnique({
          where: { id: batchId },
          select: { id: true },
        }),

        tx.backOfficeLocation.findUnique({
          where: { id: fromLocationId },
          select: {
            id: true,
            active: true,
          },
        }),

        tx.backOfficeLocation.findUnique({
          where: { id: toLocationId },
          select: {
            id: true,
            active: true,
          },
        }),
      ]);

    if (!batch) {
      throw new Error("Batch not found.");
    }

    if (!fromLocation || !fromLocation.active) {
      throw new Error(
        "Source inventory location not found or inactive."
      );
    }

    if (!toLocation || !toLocation.active) {
      throw new Error(
        "Destination inventory location not found or inactive."
      );
    }

    const sourceBalance =
      await tx.backOfficeInventoryBalance.findUnique({
        where: {
          batchId_locationId: {
            batchId,
            locationId: fromLocationId,
          },
        },
        select: {
          id: true,
          quantity: true,
        },
      });

    const sourceQuantity =
      sourceBalance?.quantity ?? 0;

    if (quantity > sourceQuantity) {
      throw new Error(
        "Transfer quantity exceeds available inventory."
      );
    }

    const destinationBalance =
      await tx.backOfficeInventoryBalance.findUnique({
        where: {
          batchId_locationId: {
            batchId,
            locationId: toLocationId,
          },
        },
        select: {
          id: true,
          quantity: true,
        },
      });

    const destinationQuantity =
      destinationBalance?.quantity ?? 0;

    const transfer =
      await tx.backOfficeInventoryTransfer.create({
        data: {
          batchId,
          fromLocationId,
          toLocationId,
          quantity,
          status: "COMPLETED",
          note: note || null,
          createdById: user.id,
          createdByName,
          completedAt: new Date(),
        },
      });

    await tx.backOfficeInventoryBalance.update({
      where: {
        id: sourceBalance!.id,
      },
      data: {
        quantity: sourceQuantity - quantity,
      },
    });

    if (destinationBalance) {
      await tx.backOfficeInventoryBalance.update({
        where: {
          id: destinationBalance.id,
        },
        data: {
          quantity:
            destinationQuantity + quantity,
        },
      });
    } else {
      await tx.backOfficeInventoryBalance.create({
        data: {
          batchId,
          locationId: toLocationId,
          quantity,
        },
      });
    }

    await tx.backOfficeInventoryMovement.create({
      data: {
        batchId,
        locationId: fromLocationId,
        type: "TRANSFER_OUT",
        quantityDelta: -quantity,
        quantityBefore: sourceQuantity,
        quantityAfter:
          sourceQuantity - quantity,
        referenceType: "INVENTORY_TRANSFER",
        referenceId: transfer.id,
        note: note || null,
        createdById: user.id,
        createdByName,
      },
    });

    await tx.backOfficeInventoryMovement.create({
      data: {
        batchId,
        locationId: toLocationId,
        type: "TRANSFER_IN",
        quantityDelta: quantity,
        quantityBefore: destinationQuantity,
        quantityAfter:
          destinationQuantity + quantity,
        referenceType: "INVENTORY_TRANSFER",
        referenceId: transfer.id,
        note: note || null,
        createdById: user.id,
        createdByName,
      },
    });
  });

  revalidatePath("/backoffice/inventory");
  revalidatePath("/backoffice/inventory/transfers");
  revalidatePath("/backoffice/inventory/ledger");
}
