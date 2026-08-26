import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";
import ProductVariantsEditor from "@/components/admin/ProductVariantsEditor";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "../product-actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="admin-editor-page">
      <Link href="/admin/inventory" className="admin-back-link">
        <ArrowLeft size={15} />
        Inventory
      </Link>

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">EDIT PRODUCT</span>
          <h1>{product.name}</h1>
          <p>
            Update catalog information, member pricing and availability.
          </p>
        </div>
      </div>

      <ProductEditor
        action={updateProduct}
        submitLabel="Save Product"
        product={{
          id: product.id,
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          strength: product.strength,
          category: product.category,
          image: product.image,
          overview: product.overview,
          composition: product.composition,
          presentation: product.presentation,
          storage: product.storage,
          researchNotice: product.researchNotice,
          featured: product.featured,
          active: product.active,
          purchasable: product.purchasable,
          trackInventory: product.trackInventory,
          sortOrder: product.sortOrder,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            strength: variant.strength,
            sku: variant.sku,
            memberPrice: variant.memberPrice?.toString() ?? null,
            inventoryQty: variant.inventoryQty,
            lowStockAt: variant.lowStockAt,
            active: variant.active,
            purchasable: variant.purchasable,
            sortOrder: variant.sortOrder,
          })),
        }}
      />

      <ProductVariantsEditor
        productId={product.id}
        variants={product.variants.map((variant) => ({
          id: variant.id,
          strength: variant.strength,
          sku: variant.sku,
          memberPrice: variant.memberPrice?.toString() ?? null,
          inventoryQty: variant.inventoryQty,
          lowStockAt: variant.lowStockAt,
          active: variant.active,
          purchasable: variant.purchasable,
          sortOrder: variant.sortOrder,
        }))}
      />
    </div>
  );
}