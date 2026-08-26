import ProductCard from "./ProductCard";
import { getProducts } from "@/lib/repositories/products";

export default async function FeaturedCompounds() {
  const products = await getProducts();

  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
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