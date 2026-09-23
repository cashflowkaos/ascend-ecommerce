import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

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
  console.log("Seeding Retail product: 5-Amino-1MQ...");

  const product = await prisma.product.upsert({
    where: {
      slug: "5-amino-1mq",
    },
    update: {
      name: "5-Amino-1MQ",
      strength: "5 mg / 10 mg / 50 mg",
      category: "Research Compound",
      image: "/bottles/5-amino-1mq.png",
      overview:
        "5-Amino-1MQ (5-amino-1-methylquinolinium) is a small-molecule inhibitor of nicotinamide N-methyltransferase (NNMT). Published research has examined NNMT inhibition in biochemical, cellular, and animal models involving metabolic regulation and NAD+-linked pathways. Available evidence remains primarily preclinical.",
      composition: [
        "5-Amino-1-methylquinolinium iodide",
        "Molecular Formula - C10H11IN2",
        "Molecular Weight - 286.11 g/mol",
        "CAS Number - 42464-96-0",
      ],
      presentation: "Lyophilized Powder",
      storage: "Store refrigerated. Protect from light.",
      researchNotice:
        "For laboratory research use only. Not for human consumption.",
      featured: false,
      active: true,
      purchasable: true,
      trackInventory: true,
    },
    create: {
      slug: "5-amino-1mq",
      sku: null,
      name: "5-Amino-1MQ",
      strength: "5 mg / 10 mg / 50 mg",
      category: "Research Compound",
      image: "/bottles/5-amino-1mq.png",
      overview:
        "5-Amino-1MQ (5-amino-1-methylquinolinium) is a small-molecule inhibitor of nicotinamide N-methyltransferase (NNMT). Published research has examined NNMT inhibition in biochemical, cellular, and animal models involving metabolic regulation and NAD+-linked pathways. Available evidence remains primarily preclinical.",
      composition: [
        "5-Amino-1-methylquinolinium iodide",
        "Molecular Formula - C10H11IN2",
        "Molecular Weight - 286.11 g/mol",
        "CAS Number - 42464-96-0",
      ],
      presentation: "Lyophilized Powder",
      storage: "Store refrigerated. Protect from light.",
      researchNotice:
        "For laboratory research use only. Not for human consumption.",
      featured: false,
      active: true,
      purchasable: true,
      trackInventory: true,
      inventoryQty: 0,
      lowStockAt: 2,
      sortOrder: 0,
    },
  });

  const variants = [
    {
      strength: "5 mg",
      sku: "5amino5",
      memberPrice: "25.00",
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 0,
    },
    {
      strength: "10 mg",
      sku: "5amino10",
      memberPrice: "40.00",
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 1,
    },
    {
      strength: "50 mg",
      sku: "5amino50",
      memberPrice: "100.00",
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 2,
    },
  ];

  for (const variant of variants) {
    await prisma.productVariant.upsert({
      where: {
        productId_strength: {
          productId: product.id,
          strength: variant.strength,
        },
      },
      update: {
        sku: variant.sku,
        memberPrice: variant.memberPrice,
        lowStockAt: variant.lowStockAt,
        active: true,
        purchasable: true,
        sortOrder: variant.sortOrder,
      },
      create: {
        productId: product.id,
        strength: variant.strength,
        sku: variant.sku,
        memberPrice: variant.memberPrice,
        inventoryQty: variant.inventoryQty,
        lowStockAt: variant.lowStockAt,
        active: true,
        purchasable: true,
        sortOrder: variant.sortOrder,
      },
    });
  }

  await prisma.productLiterature.deleteMany({
    where: {
      productId: product.id,
    },
  });

  await prisma.productLiterature.create({
    data: {
      productId: product.id,
      title:
        "Selective and membrane-permeable small molecule inhibitors of nicotinamide N-methyltransferase reverse high fat diet-induced obesity in mice",
      journal: "Scientific Reports",
      year: 2018,
      type: "Preclinical Study",
      url: "https://pubmed.ncbi.nlm.nih.gov/29155147/",
      sortOrder: 0,
    },
  });

  const result = await prisma.product.findUnique({
    where: {
      id: product.id,
    },
    include: {
      variants: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      literature: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  console.log("");
  console.log("5-AMINO-1MQ RETAIL SEED COMPLETE");
  console.log("--------------------------------");

  console.log({
    id: result?.id,
    name: result?.name,
    slug: result?.slug,
    category: result?.category,
    active: result?.active,
    purchasable: result?.purchasable,
  });

  console.log("");
  console.log("Variants:");

  for (const variant of result?.variants ?? []) {
    console.log(
      `  ${variant.strength} | $${variant.memberPrice} | Qty ${variant.inventoryQty} | Alert ${variant.lowStockAt} | SKU ${variant.sku}`
    );
  }

  console.log("");
  console.log(`Literature references: ${result?.literature.length ?? 0}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
