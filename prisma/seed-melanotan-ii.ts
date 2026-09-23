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
    where: { slug: "melanotan-ii" },

    update: {
      name: "Melanotan II",
      strength: "10 mg",
      category: "Research Peptide",
      image: "/bottles/melanotan-ii.png",
      overview:
        "Melanotan II (MT-II) is a synthetic cyclic heptapeptide analog of alpha-melanocyte-stimulating hormone (alpha-MSH). It has been investigated experimentally as a non-selective melanocortin receptor agonist, including research involving melanocortin signaling and pigmentation.",
      composition: [
        "Melanotan II (MT-II)",
        "Peptide Sequence - Ac-Nle-Asp-His-D-Phe-Arg-Trp-Lys-NH2",
        "Molecular Formula - C50H69N15O9",
        "Molecular Weight - 1024.2 g/mol",
        "CAS Number - 121062-08-6",
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
      slug: "melanotan-ii",
      name: "Melanotan II",
      strength: "10 mg",
      category: "Research Peptide",
      image: "/bottles/melanotan-ii.png",
      overview:
        "Melanotan II (MT-II) is a synthetic cyclic heptapeptide analog of alpha-melanocyte-stimulating hormone (alpha-MSH). It has been investigated experimentally as a non-selective melanocortin receptor agonist, including research involving melanocortin signaling and pigmentation.",
      composition: [
        "Melanotan II (MT-II)",
        "Peptide Sequence - Ac-Nle-Asp-His-D-Phe-Arg-Trp-Lys-NH2",
        "Molecular Formula - C50H69N15O9",
        "Molecular Weight - 1024.2 g/mol",
        "CAS Number - 121062-08-6",
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
      sku: "mt2-10",
      memberPrice: 35,
      lowStockAt: 2,
      active: true,
      purchasable: true,
      sortOrder: 0,
    },

    create: {
      productId: product.id,
      strength: "10 mg",
      sku: "mt2-10",
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
        "Evaluation of melanotan-II, a superpotent cyclic melanotropic peptide in a pilot phase-I clinical study",
      journal: "Life Sciences",
      year: 1996,
      type: "Phase I Study",
      url: "https://pubmed.ncbi.nlm.nih.gov/8637402/",
      sortOrder: 0,
    },
  });

  console.log("");
  console.log("MELANOTAN II RETAIL SEED COMPLETE");
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
