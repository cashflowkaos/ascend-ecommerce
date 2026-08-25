import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductEditor from "@/components/admin/ProductEditor";
import { createProduct } from "../product-actions";

export default function NewProductPage() {
  return (
    <div className="admin-editor-page">
      <Link href="/admin/inventory" className="admin-back-link">
        <ArrowLeft size={15} />
        Inventory
      </Link>

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">NEW PRODUCT</span>
          <h1>Add Product</h1>
          <p>
            Create a new product for the Ascend research catalog.
          </p>
        </div>
      </div>

      <ProductEditor
        action={createProduct}
        submitLabel="Create Product"
      />
    </div>
  );
}
