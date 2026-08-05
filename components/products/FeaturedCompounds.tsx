import ProductCard from "./ProductCard";
import { compounds } from "@/lib/data/compounds";

export default function FeaturedCompounds() {
  return (
    <section className="bg-white py-32">
      <div className="mx-auto max-w-[1400px] px-10">

        <div className="mb-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#D4A11E]">
            Featured Compounds
          </p>

          <h2 className="mt-4 text-5xl font-light">
            Explore Our Collection
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {compounds.map((product) => (
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