import CompoundSearch from "./CompoundSearch";
import { getProducts } from "@/lib/repositories/products";

export default async function FeaturedCompounds() {
  const products = await getProducts();

  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <CompoundSearch products={products} />
      </div>
    </section>
  );
}
