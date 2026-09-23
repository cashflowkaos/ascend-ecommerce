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
    where: { slug: "sermorelin" },

    update: {
      name: "Sermorelin",
      strength: "5 mg / 10 mg",
      category: "Research Peptide",
      image: "/bottles/sermorelin.png",
      overview:
        "Sermorelin is a synthetic 29-amino-acid peptide corresponding to the biologically active N-terminal segment of human growth hormone-releasing hormone (GHRH). Also designated GHRH(1-29)-NH2, it has been studied experimentally for its interaction with the GHRH receptor and stimulation of growth hormone secretion.",
      composition: [
        "Sermorelin (GHRH 1-29 amide)",
        "Peptide Sequence - YADAIFTNSYRKVLGQLSARKLLQDIMSR-NH2",
        "Molecular Formula - C149H246N44O42S",
        "Molecular Weight - 3357.9 g/mol",
        "CAS Number - 86168-78-7",
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
      slug: "sermorelin",
      name: "Sermorelin",
      strength: "5 mg / 10 mg",
      category: "Research Peptide",
      image: "/bottles/sermorelin.png",
      overview:
        "Sermorelin is a synthetic 29-amino-acid peptide corresponding to the biologically active N-terminal segment of human growth hormone-releasing hormone (GHRH). Also designated GHRH(1-29)-NH2, it has been studied experimentally for its interaction with the GHRH receptor and stimulation of growth hormone secretion.",
      composition: [
        "Sermorelin (GHRH 1-29 amide)",
        "Peptide Sequence - YADAIFTNSYRKVLGQLSARKLLQDIMSR-NH2",
        "Molecular Formula - C149H246N44O42S",
        "Molecular Weight - 3357.9 g/mol",
        "CAS Number - 86168-78-7",
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
      strength: "5 mg",
      sku: "serm5",
      memberPrice: 25,
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 0,
    },
    {
      strength: "10 mg",
      sku: "serm10",
      memberPrice: 50,
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
        "Low-dose growth hormone-releasing hormone tests: a dose-response study",
      journal: "Clinical Endocrinology",
      year: 1994,
      type: "Human Study",
      url: "https://pubmed.ncbi.nlm.nih.gov/7921207/",
      sortOrder: 0,
    },
  });

  const savedVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: { sortOrder: "asc" },
  });

  console.log("");
  console.log("SERMORELIN RETAIL SEED COMPLETE");
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
