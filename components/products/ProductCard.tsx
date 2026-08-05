import Image from "next/image";
import Link from "next/link";

type Product = {
  id: string;
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
      href={`/compound/${product.id}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-2 hover:border-[#D4A11E] hover:shadow-2xl">

        <div className="flex h-72 items-center justify-center bg-gradient-to-b from-white to-neutral-50 p-10">

          <Image
            src={product.image}
            alt={product.name}
            width={220}
            height={220}
            className="transition duration-300 group-hover:scale-105"
          />

        </div>

        <div className="border-t border-neutral-200 p-6">

          <p className="text-xs uppercase tracking-[0.35em] text-[#D4A11E]">
            Research Compound
          </p>

          <h3 className="mt-3 text-xl font-medium">
            {product.name}
          </h3>

          <p className="mt-2 text-neutral-500">
            {product.strength}
          </p>

        </div>

      </div>
    </Link>
  );
}