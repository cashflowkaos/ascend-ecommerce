import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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

      <main className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">

          <Link
            href="/compounds"
            className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-[#D4A11E] sm:mb-10 lg:mb-12"
          >
            <ArrowLeft size={18} />
            Back to Collection
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16 xl:gap-20">

            <div className="flex min-h-[330px] items-center justify-center rounded-[24px] border border-neutral-200 bg-gradient-to-b from-white via-white to-neutral-50 p-7 sm:min-h-[460px] sm:rounded-[30px] sm:p-10 lg:min-h-[600px] lg:rounded-[36px] lg:p-14">

              <Image
                src={product.image}
                alt={product.name}
                width={520}
                height={520}
                priority
                className="h-auto max-h-[290px] w-auto max-w-full object-contain drop-shadow-2xl sm:max-h-[400px] lg:max-h-[500px]"
              />

            </div>

            <div className="lg:pt-4">

              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4A11E] sm:text-sm sm:tracking-[0.35em]">
                Research Compound
              </p>

              <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight text-neutral-950 sm:mt-4 sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>

              <p className="mt-3 text-lg font-medium text-neutral-600 sm:mt-4 sm:text-xl">
                {product.strength}
              </p>

              <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 sm:mt-10">

                <section className="py-6 sm:py-7">
                  <h2 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                    Overview
                  </h2>

                  <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base sm:leading-8">
                    {product.overview}
                  </p>
                </section>

                <section className="py-6 sm:py-7">
                  <h2 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                    Presentation
                  </h2>

                  <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base">
                    {product.presentation}
                  </p>
                </section>

                <section className="py-6 sm:py-7">
                  <h2 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                    Storage
                  </h2>

                  <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base">
                    {product.storage}
                  </p>
                </section>

                <section className="py-6 sm:py-7">
                  <h2 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                    Category
                  </h2>

                  <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base">
                    {product.category}
                  </p>
                </section>

              </div>

              <div className="mt-7 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4A11E]">
                  Research Use
                </p>

                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  Product information is provided for research and analytical
                  reference purposes.
                </p>
              </div>

            </div>

          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}
