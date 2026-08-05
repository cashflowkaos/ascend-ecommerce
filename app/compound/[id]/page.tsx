import Header from "@/components/layout/Header";
import { compounds } from "@/lib/data/compounds";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function CompoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = compounds.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />

      <main className="bg-white min-h-screen">
        <section className="mx-auto flex max-w-[1400px] flex-col gap-16 px-10 py-20 lg:flex-row">

          <div className="flex flex-1 items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 p-16">

            <Image
              src={product.image}
              alt={product.name}
              width={420}
              height={420}
            />

          </div>

          <div className="flex-1">

            <p className="uppercase tracking-[0.35em] text-[#D4A11E] text-sm">
              Research Compound
            </p>

            <h1 className="mt-4 text-6xl font-light">
              {product.name}
            </h1>

            <p className="mt-6 text-xl text-neutral-500">
              {product.strength}
            </p>

            <div className="mt-12 rounded-3xl border border-neutral-200 p-8">

              <h2 className="mb-4 text-2xl font-medium">
                Specifications
              </h2>

              <ul className="space-y-4 text-neutral-600">
                <li>• High purity research compound</li>
                <li>• Laboratory presentation</li>
                <li>• Professional packaging</li>
                <li>• Documentation available where applicable</li>
              </ul>

            </div>

          </div>

        </section>
      </main>
    </>
  );
}