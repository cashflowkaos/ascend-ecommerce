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
    where: { slug: "pt-141" },

    update: {
      name: "PT-141",
      strength: "10 mg",
      category: "Research Peptide",
      image: "/bottles/pt-141.png",
      overview:
        "PT-141, also known as bremelanotide, is a synthetic cyclic peptide derived from melanocortin peptide research. It acts as a melanocortin receptor agonist and has been investigated in research involving central melanocortin signaling and physiological responses associated with melanocortin receptor activation.",
      composition: [
        "PT-141 (Bremelanotide)",
        "Cyclic melanocortin peptide",
        "Peptide Sequence - Ac-Nle-Asp-His-D-Phe-Arg-Trp-Lys",
        "Free-base Molecular Formula - C50H68N14O10",
        "Free-base Molecular Weight - 1025.2 g/mol",
        "Free-base CAS Number - 189691-06-3",
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
      slug: "pt-141",
      name: "PT-141",
      strength: "10 mg",
      category: "Research Peptide",
      image: "/bottles/pt-141.png",
      overview:
        "PT-141, also known as bremelanotide, is a synthetic cyclic peptide derived from melanocortin peptide research. It acts as a melanocortin receptor agonist and has been investigated in research involving central melanocortin signaling and physiological responses associated with melanocortin receptor activation.",
      composition: [
        "PT-141 (Bremelanotide)",
        "Cyclic melanocortin peptide",
        "Peptide Sequence - Ac-Nle-Asp-His-D-Phe-Arg-Trp-Lys",
        "Free-base Molecular Formula - C50H68N14O10",
        "Free-base Molecular Weight - 1025.2 g/mol",
        "Free-base CAS Number - 189691-06-3",
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
        strength: "10 mg",
      },
    },

    update: {
      sku: "pt141-10",
      memberPrice: 35,
      lowStockAt: 2,
      active: true,
      purchasable: true,
      sortOrder: 0,
    },

    create: {
      productId: product.id,
      strength: "10 mg",
      sku: "pt141-10",
      memberPrice: 35,
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
        "Double-blind, placebo-controlled evaluation of the safety, pharmacokinetic properties and pharmacodynamic effects of intranasal PT-141",
      journal: "International Journal of Impotence Research",
      year: 2004,
      type: "Human Study",
      url: "https://pubmed.ncbi.nlm.nih.gov/14963471/",
      sortOrder: 0,
    },
  });

  console.log("");
  console.log("PT-141 RETAIL SEED COMPLETE");
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
