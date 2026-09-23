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
    where: { slug: "ipamorelin" },

    update: {
      name: "Ipamorelin",
      strength: "5 mg / 10 mg",
      category: "Research Peptide",
      image: "/bottles/ipamorelin.png",
      overview:
        "Ipamorelin is a synthetic pentapeptide growth hormone secretagogue studied in experimental models involving growth hormone release and growth hormone secretagogue receptor signaling. Published research includes preclinical characterization as well as pharmacokinetic and pharmacodynamic investigation in human volunteers.",
      composition: [
        "Ipamorelin",
        "Peptide Sequence - Aib-His-D-2-Nal-D-Phe-Lys-NH2",
        "Molecular Formula - C38H49N9O5",
        "Molecular Weight - 711.9 g/mol",
        "CAS Number - 170851-70-4",
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
      slug: "ipamorelin",
      name: "Ipamorelin",
      strength: "5 mg / 10 mg",
      category: "Research Peptide",
      image: "/bottles/ipamorelin.png",
      overview:
        "Ipamorelin is a synthetic pentapeptide growth hormone secretagogue studied in experimental models involving growth hormone release and growth hormone secretagogue receptor signaling. Published research includes preclinical characterization as well as pharmacokinetic and pharmacodynamic investigation in human volunteers.",
      composition: [
        "Ipamorelin",
        "Peptide Sequence - Aib-His-D-2-Nal-D-Phe-Lys-NH2",
        "Molecular Formula - C38H49N9O5",
        "Molecular Weight - 711.9 g/mol",
        "CAS Number - 170851-70-4",
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
      sku: "ipa5",
      memberPrice: 35,
      inventoryQty: 10,
      lowStockAt: 2,
      sortOrder: 0,
    },
    {
      strength: "10 mg",
      sku: "ipa10",
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

  await prisma.productLiterature.createMany({
    data: [
      {
        productId: product.id,
        title:
          "Ipamorelin, the first selective growth hormone secretagogue",
        journal: "European Journal of Endocrinology",
        year: 1998,
        type: "Primary Research",
        url: "https://pubmed.ncbi.nlm.nih.gov/9849822/",
        sortOrder: 0,
      },
      {
        productId: product.id,
        title:
          "Pharmacokinetic-pharmacodynamic modeling of ipamorelin, a growth hormone releasing peptide, in human volunteers",
        journal: "Pharmaceutical Research",
        year: 1999,
        type: "Human Study",
        url: "https://pubmed.ncbi.nlm.nih.gov/10496658/",
        sortOrder: 1,
      },
    ],
  });

  const savedVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: { sortOrder: "asc" },
  });

  console.log("");
  console.log("IPAMORELIN RETAIL SEED COMPLETE");
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
  console.log("Literature references: 2");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
