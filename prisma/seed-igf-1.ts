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
    where: { slug: "igf-1" },

    update: {
      name: "IGF-1",
      strength: "1 mg",
      category: "Research Peptide",
      image: "/bottles/igf-1.png",
      overview:
        "Insulin-like growth factor 1 (IGF-1) is a 70-amino-acid polypeptide involved in experimental research examining growth-factor signaling, cellular proliferation, differentiation, metabolism, and tissue-specific signaling pathways. IGF-1 primarily acts through the IGF-1 receptor and associated intracellular signaling pathways.",
      composition: [
        "Insulin-like Growth Factor 1 (IGF-1)",
        "Mature Peptide - 70 amino acids",
        "Molecular Weight - approximately 7.65 kDa",
        "Single-chain polypeptide with three disulfide bonds",
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
      slug: "igf-1",
      name: "IGF-1",
      strength: "1 mg",
      category: "Research Peptide",
      image: "/bottles/igf-1.png",
      overview:
        "Insulin-like growth factor 1 (IGF-1) is a 70-amino-acid polypeptide involved in experimental research examining growth-factor signaling, cellular proliferation, differentiation, metabolism, and tissue-specific signaling pathways. IGF-1 primarily acts through the IGF-1 receptor and associated intracellular signaling pathways.",
      composition: [
        "Insulin-like Growth Factor 1 (IGF-1)",
        "Mature Peptide - 70 amino acids",
        "Molecular Weight - approximately 7.65 kDa",
        "Single-chain polypeptide with three disulfide bonds",
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

  const variant = await prisma.productVariant.upsert({
    where: {
      productId_strength: {
        productId: product.id,
        strength: "1 mg",
      },
    },

    update: {
      sku: "igf1-1",
      memberPrice: 45,
      lowStockAt: 2,
      active: true,
      purchasable: true,
      sortOrder: 0,
    },

    create: {
      productId: product.id,
      strength: "1 mg",
      sku: "igf1-1",
      memberPrice: 45,
      inventoryQty: 10,
      lowStockAt: 2,
      active: true,
      purchasable: true,
      sortOrder: 0,
    },
  });

  await prisma.productLiterature.deleteMany({
    where: { productId: product.id },
  });

  await prisma.productLiterature.create({
    data: {
      productId: product.id,
      title:
        "The amino acid sequence of human insulin-like growth factor I and its structural homology with proinsulin",
      journal: "Journal of Biological Chemistry",
      year: 1978,
      type: "Primary Research",
      url: "https://pubmed.ncbi.nlm.nih.gov/632300/",
      sortOrder: 0,
    },
  });

  console.log("");
  console.log("IGF-1 RETAIL SEED COMPLETE");
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
  console.log("Variant:");
  console.log(
    `  ${variant.strength} | $${variant.memberPrice} | Qty ${variant.inventoryQty} | Alert ${variant.lowStockAt} | SKU ${variant.sku}`
  );

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
