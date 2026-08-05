import ProductCard from "./ProductCard";
import { getProducts } from "@/lib/repositories/products";

export default async function FeaturedCompounds() {
  const products = await getProducts();

  return (
    <section className="bg-white pb-28">
      <div className="mx-auto max-w-[1500px] px-8">

        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

      </div>
    </section>
  );
}