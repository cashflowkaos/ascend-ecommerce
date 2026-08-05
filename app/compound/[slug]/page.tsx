import Header from "@/components/layout/Header";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProduct } from "@/lib/repositories/products";

export default async function CompoundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white">

        <section className="mx-auto max-w-[1400px] px-10 py-16">

          <Link
            href="/compounds"
            className="mb-12 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-[#D4A11E]"
          >
            <ArrowLeft size={18} />
            Back to Collection
          </Link>

          <div className="grid gap-20 lg:grid-cols-2">

            <div className="flex items-center justify-center rounded-[36px] border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-16">

              <Image
                src={product.image}
                alt={product.name}
                width={520}
                height={520}
                className="h-auto w-[420px] drop-shadow-2xl"
              />

            </div>

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4A11E]">
                Research Compound
              </p>

              <h1 className="mt-4 text-6xl font-light tracking-tight">
                {product.name}
              </h1>

              <p className="mt-4 text-xl text-neutral-500">
                {product.strength}
              </p>

              <div className="mt-10 space-y-8">

                <section>
                  <h2 className="mb-3 text-xl font-medium">Overview</h2>
                  <p className="leading-8 text-neutral-600">
                    {product.overview}
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-medium">Presentation</h2>
                  <p className="text-neutral-600">
                    {product.presentation}
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-medium">Storage</h2>
                  <p className="text-neutral-600">
                    {product.storage}
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-medium">Category</h2>
                  <p className="text-neutral-600">
                    {product.category}
                  </p>
                </section>

              </div>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}