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

function distroPrice(
  cost: number | null,
  tier: string | null
) {
  if (cost === null) return null;

  switch (tier) {
    case "TIER_1":
      return Math.ceil(cost * 1.4);
    case "TIER_2":
      return Math.ceil(cost * 1.35);
    case "TIER_3":
      return Math.ceil(cost * 1.3);
    default:
      return null;
  }
}

export default async function DistroPage() {
  const member = await requireDistroMember();

  const products = await prisma.distroProduct.findMany({
    where: {
      enabled: true,
      backOfficeProduct: {
        is: {
          active: true,
        },
      },
    },
    orderBy: {
      backOfficeProduct: {
        name: "asc",
      },
    },
    select: {
      id: true,
      available: true,
      backOfficeProduct: {
        select: {
          sku: true,
          name: true,
          description: true,
          cost: true,
        },
      },
    },
  });

  const catalog = products
    .filter(
      (product) => product.backOfficeProduct !== null
    )
    .map((product) => {
      const backOfficeProduct =
        product.backOfficeProduct!;

      const cost =
        backOfficeProduct.cost === null
          ? null
          : Number(backOfficeProduct.cost);

      return {
        id: product.id,
        sku: backOfficeProduct.sku,
        name: backOfficeProduct.name,
        description: backOfficeProduct.description,
        available: product.available,
        price: distroPrice(
          cost,
          member.distroTier
        ),
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