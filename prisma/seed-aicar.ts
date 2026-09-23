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
    where: {
      slug: "aicar",
    },
    update: {
      name: "AICAR",
      strength: "50 mg",
      category: "Research Compound",
      image: "/bottles/aicar.png",
      overview:
        "AICAR (5-aminoimidazole-4-carboxamide ribonucleoside), also known as acadesine or AICA-riboside, is a nucleoside analog widely used in experimental research involving cellular energy regulation and AMP-activated protein kinase (AMPK) signaling. Published research has also identified important AMPK-independent biological effects.",
      composition: [
        "AICAR (Acadesine / AICA-riboside)",
        "Molecular Formula - C9H14N4O5",
        "Molecular Weight - 258.23 g/mol",
        "CAS Number - 2627-69-2",
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
      slug: "aicar",
      name: "AICAR",
      strength: "50 mg",
      category: "Research Compound",
      image: "/bottles/aicar.png",
      overview:
        "AICAR (5-aminoimidazole-4-carboxamide ribonucleoside), also known as acadesine or AICA-riboside, is a nucleoside analog widely used in experimental research involving cellular energy regulation and AMP-activated protein kinase (AMPK) signaling. Published research has also identified important AMPK-independent biological effects.",
      composition: [
        "AICAR (Acadesine / AICA-riboside)",
        "Molecular Formula - C9H14N4O5",
        "Molecular Weight - 258.23 g/mol",
        "CAS Number - 2627-69-2",
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
        strength: "50 mg",
      },
    },
    update: {
      sku: "aicar50",
      memberPrice: 50,
      lowStockAt: 2,
      active: true,
      purchasable: true,
      sortOrder: 0,
    },
    create: {
      productId: product.id,
      strength: "50 mg",
      sku: "aicar50",
      memberPrice: 50,
      inventoryQty: 10,
      lowStockAt: 2,
      active: true,
      purchasable: true,
      sortOrder: 0,
    },
  });

  await prisma.productLiterature.deleteMany({
    where: {
      productId: product.id,
    },
  });

  await prisma.productLiterature.create({
    data: {
      productId: product.id,
      title:
        "AICAr, a Widely Used AMPK Activator with Important AMPK-Independent Effects: A Systematic Review",
      journal: "Cells",
      year: 2021,
      type: "Systematic Review",
      url: "https://pubmed.ncbi.nlm.nih.gov/34064363/",
      sortOrder: 0,
    },
  });

  console.log("");
  console.log("AICAR RETAIL SEED COMPLETE");
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
