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
      <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white transition-all duration-500 hover:-translate-y-2 hover:border-[#D4A11E] hover:shadow-2xl">

        <div className="flex h-[460px] items-center justify-center bg-gradient-to-b from-white via-white to-neutral-50 px-10 pt-10 pb-6">

          <Image
  src={product.image}
  alt={product.name}
  width={340}
  height={340}
  className="h-auto w-[340px] drop-shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105"
/>

        </div>

        <div className="border-t border-neutral-200 p-6">

          <p className="text-xs uppercase tracking-[0.35em] text-[#D4A11E]">
            Research Compound
          </p>

          <h3 className="mt-3 text-xl font-medium">
            {product.name}
          </h3>

          <p className="mt-2 text-sm uppercase tracking-[0.25em] text-neutral-500">
            {product.strength}
          </p>

        </div>

      </div>
    </Link>
  );
}