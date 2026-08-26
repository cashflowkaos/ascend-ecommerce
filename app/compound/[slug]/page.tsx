import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProduct } from "@/lib/repositories/products";
import { hasStorefrontMemberAccess } from "@/lib/auth";
import MemberPurchaseBox from "@/components/products/MemberPurchaseBox";

export default async function CompoundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const memberMode =
    await hasStorefrontMemberAccess();

  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header memberMode={memberMode} />

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


              <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 sm:mt-10">

                <section className="py-6 sm:py-7">
                  <h2 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                    Overview
                  </h2>

                  <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base sm:leading-8">
                    {product.overview}
                  </p>
                </section>

                {"composition" in product && product.composition && (
                  <section className="py-6 sm:py-7">
                    <h2 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                      Composition
                    </h2>

                    <div className="mt-4 space-y-3">
                      {product.composition.map((component) => (
                        <div
                          key={component}
                          className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                        >
                          <span className="text-[15px] font-medium text-neutral-700">
                            {component}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

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

                {"literature" in product && product.literature && product.literature.length > 0 && (
                  <section className="py-6 sm:py-7">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4A11E]">
                          Published Research
                        </p>

                        <h2 className="mt-2 text-lg font-semibold text-neutral-950 sm:text-xl">
                          Research Literature
                        </h2>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {product.literature.map((publication) => (
                        <a
                          key={publication.url}
                          href={publication.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-[#D4A11E] hover:bg-white sm:p-5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                              {publication.type}
                            </span>

                            <span className="text-xs text-neutral-500">
                              {publication.journal} · {publication.year}
                            </span>
                          </div>

                          <h3 className="mt-3 text-[15px] font-semibold leading-6 text-neutral-900 transition group-hover:text-[#D4A11E] sm:text-base">
                            {publication.title}
                          </h3>

                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A11E]">
                            View on PubMed →
                          </p>
                        </a>
                      ))}
                    </div>

                    <p className="mt-4 text-xs leading-5 text-neutral-500">
                      References are provided for scientific and bibliographic
                      context. Inclusion does not imply that the cited
                      publication evaluated this specific Ascend product or
                      formulation.
                    </p>
                  </section>
                )}

              </div>

              {memberMode && (
                <MemberPurchaseBox
                  productId={product.commerceProductId!}
                  slug={product.slug}
                  productName={product.name}
                  image={product.image}
                  variants={product.variants}
                />
              )}

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
