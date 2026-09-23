import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const product = await prisma.product.upsert({
    where: { slug: "epitalon" },

    update: {
      name: "Epitalon",
      strength: "10 mg / 50 mg",
      category: "Research Peptide",
      image: "/bottles/epitalon.png",
      overview:
        "Epitalon, also known as Epithalon or Epithalone, is a synthetic tetrapeptide composed of Ala-Glu-Asp-Gly (AEDG). Published experimental research has examined Epitalon in cellular and animal models involving gene expression, neuroendocrine signaling, oxidative processes, telomerase activity, and other biological pathways associated with aging research.",
      composition: [
        "Epitalon (Ala-Glu-Asp-Gly)",
        "Peptide Sequence - AEDG",
        "Molecular Formula - C14H22N4O9",
        "Molecular Weight - 390.35 g/mol",
        "CAS Number - 307297-39-8",
      ],
      presentation: "Lyophilized Powder",
      storage: "Store refrigerated. Protect from light.",
      researchNotice:
        "For laboratory research use only. Not for human consumption.",
      featured: false,
      active: true,
      purchasable: true,
    },

    create: {
      slug: "epitalon",
      name: "Epitalon",
      strength: "10 mg / 50 mg",
      category: "Research Peptide",
      image: "/bottles/epitalon.png",
      overview:
        "Epitalon, also known as Epithalon or Epithalone, is a synthetic tetrapeptide composed of Ala-Glu-Asp-Gly (AEDG). Published experimental research has examined Epitalon in cellular and animal models involving gene expression, neuroendocrine signaling, oxidative processes, telomerase activity, and other biological pathways associated with aging research.",
      composition: [
        "Epitalon (Ala-Glu-Asp-Gly)",
        "Peptide Sequence - AEDG",
        "Molecular Formula - C14H22N4O9",
        "Molecular Weight - 390.35 g/mol",
        "CAS Number - 307297-39-8",
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
    },
  });

  const variants = [
    {
      strength: "10 mg",
      sku: "epi10",
      memberPrice: 25,
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 0,
    },
    {
      strength: "50 mg",
      sku: "epi50",
      memberPrice: 85,
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 1,
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
    where: { productId: product.id },
  });

  await prisma.productLiterature.create({
    data: {
      productId: product.id,
      title:
        "Overview of Epitalon-Highly Bioactive Pineal Tetrapeptide with Promising Properties",
      journal: "International Journal of Molecular Sciences",
      year: 2025,
      type: "Review",
      url: "https://pubmed.ncbi.nlm.nih.gov/40141333/",
      sortOrder: 0,
    },
  });

  const savedVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: { sortOrder: "asc" },
  });

  console.log("");
  console.log("EPITALON RETAIL SEED COMPLETE");
  console.log("--------------------------------");
  console.log({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    active: product.active,
    purchasable: product.purchasable,
  });

  console.log("");
  console.log("Variants:");

  for (const variant of savedVariants) {
    console.log(
      `  ${variant.strength} | $${variant.memberPrice} | Qty ${variant.inventoryQty} | Alert ${variant.lowStockAt} | SKU ${variant.sku}`
    );
  }

  console.log("");
  console.log("Literature references: 1");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
