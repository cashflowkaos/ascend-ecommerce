import DistroCatalog from "@/components/distro/DistroCatalog";
import Header from "@/components/layout/Header";
import { requireDistroMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function tierLabel(tier: string | null) {
  switch (tier) {
    case "TIER_1":
      return "Tier 1";
    case "TIER_2":
      return "Tier 2";
    case "TIER_3":
      return "Tier 3";
    default:
      return "Distro";
  }
}

export default async function DistroPage() {
  const member = await requireDistroMember();

  const products = await prisma.distroProduct.findMany({
    where: { enabled: true },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      available: true,

      ...(member.distroTier === "TIER_1"
        ? { tier1Price: true }
        : member.distroTier === "TIER_2"
          ? { tier2Price: true }
          : { tier3Price: true }),
    },
  });

  const catalog = products.map((product) => {
    let price: number | null = null;

    if (
      member.distroTier === "TIER_1" &&
      "tier1Price" in product
    ) {
      price =
        product.tier1Price === null
          ? null
          : Number(product.tier1Price);
    }

    if (
      member.distroTier === "TIER_2" &&
      "tier2Price" in product
    ) {
      price =
        product.tier2Price === null
          ? null
          : Number(product.tier2Price);
    }

    if (
      member.distroTier === "TIER_3" &&
      "tier3Price" in product
    ) {
      price =
        product.tier3Price === null
          ? null
          : Number(product.tier3Price);
    }

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      available: product.available,
      price,
    };
  });

  return (
    <>
      <Header memberMode />

      <main className="distro-page">
      <div className="distro-shell">
        <header className="distro-header">
          <div>
            <span className="distro-eyebrow">
              ASCEND DISTRO
            </span>

            <h1>Distribution Catalog</h1>

            <p>
              Private wholesale inventory for approved Ascend
              distribution members.
            </p>
          </div>

          <div className="distro-header-actions">
            <span className="distro-tier-badge">
              {tierLabel(member.distroTier)}
            </span>
          </div>
        </header>

        <DistroCatalog products={catalog} />
      </div>
      </main>
    </>
  );
}