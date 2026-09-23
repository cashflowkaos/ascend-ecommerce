import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    where: {
      variants: {
        some: {},
      },
    },
    select: {
      name: true,
      slug: true,
      strength: true,
      sku: true,
      variants: {
        select: {
          strength: true,
          sku: true,
          memberPrice: true,
          inventoryQty: true,
          lowStockAt: true,
          active: true,
          purchasable: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    take: 10,
  });

  console.dir(products, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
