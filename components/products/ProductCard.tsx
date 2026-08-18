import Image from "next/image";
import Link from "next/link";

type Product = {
  id: string;
  slug: string;
  name: string;
  strength: string;
  image: string;
};

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <Link
      href={`/compound/${product.slug}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white transition-all duration-300 hover:border-[#D4A11E] hover:shadow-xl sm:rounded-[28px] lg:rounded-[32px]">

        <div className="flex h-[280px] items-center justify-center bg-gradient-to-b from-white via-white to-neutral-50 px-6 py-6 sm:h-[340px] sm:px-8 lg:h-[400px]">

          <Image
            src={product.image}
            alt={product.name}
            width={340}
            height={340}
            className="h-auto max-h-[240px] w-auto max-w-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.03] sm:max-h-[290px] lg:max-h-[340px]"
          />

        </div>

        <div className="border-t border-neutral-200 p-5 sm:p-6">

          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D4A11E] sm:text-xs sm:tracking-[0.35em]">
            Research Compound
          </p>

          <h3 className="mt-3 text-xl font-medium text-neutral-950 sm:text-[22px]">
            {product.name}
          </h3>

          <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-neutral-600 sm:text-sm sm:tracking-[0.25em]">
            {product.strength}
          </p>

        </div>

      </article>
    </Link>
  );
}
