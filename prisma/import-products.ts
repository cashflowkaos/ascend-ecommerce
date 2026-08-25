import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { compounds } from "../lib/data/compounds";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(`Importing ${compounds.length} Ascend products...`);

  for (let index = 0; index < compounds.length; index++) {
    const compound = compounds[index];

    const product = await prisma.product.upsert({
      where: {
        slug: compound.slug,
      },
      update: {
        name: compound.name,
        strength: compound.strength,
        category: compound.category,
        image: compound.image,
        overview: compound.overview,
        composition: compound.composition ?? undefined,
        presentation: compound.presentation,
        storage: compound.storage,
        featured: compound.featured,
        active: true,
        sortOrder: index,
      },
      create: {
        slug: compound.slug,
        name: compound.name,
        strength: compound.strength,
        category: compound.category,
        image: compound.image,
        overview: compound.overview,
        composition: compound.composition ?? undefined,
        presentation: compound.presentation,
        storage: compound.storage,
        researchNotice:
          "For laboratory research use only. Not for human consumption.",
        featured: compound.featured,
        active: true,
        purchasable: false,
        trackInventory: true,
        inventoryQty: 0,
        lowStockAt: 5,
        sortOrder: index,
      },
    });

    await prisma.productLiterature.deleteMany({
      where: {
        productId: product.id,
      },
    });

    if (compound.literature?.length) {
      await prisma.productLiterature.createMany({
        data: compound.literature.map((reference, literatureIndex) => ({
          productId: product.id,
          title: reference.title,
          journal: reference.journal,
          year: reference.year,
          type: reference.type,
          url: reference.url,
          sortOrder: literatureIndex,
        })),
      });
    }

    console.log(`  OK  ${compound.name} ${compound.strength}`);
  }

  const productCount = await prisma.product.count();
  const literatureCount = await prisma.productLiterature.count();

  console.log("");
  console.log("ASCEND DATABASE IMPORT COMPLETE");
  console.log(`Products:   ${productCount}`);
  console.log(`Literature: ${literatureCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
