import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FeaturedCompounds from "@/components/products/FeaturedCompounds";
import { hasStorefrontMemberAccess } from "@/lib/auth";

export default async function CompoundsPage() {
  const memberMode =
    await hasStorefrontMemberAccess();

  return (
    <>
      <Header memberMode={memberMode} />

      <main className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-[1400px] px-5 py-12 text-center sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D4A11E] sm:text-sm sm:tracking-[0.45em]">
            Collection
          </p>

          <h1 className="mt-4 text-4xl font-light leading-tight tracking-tight text-neutral-950 sm:mt-5 sm:text-5xl lg:text-6xl">
            Research Compounds
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:mt-7 sm:text-lg sm:leading-8">
            Explore our collection of research compounds selected with a focus
            on purity, consistency, and uncompromising quality.
          </p>
        </section>

        {!memberMode && (
          <section className="mx-auto mb-10 max-w-[1500px] px-5 sm:mb-12 sm:px-8 lg:px-10">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-6 sm:px-8">
              <div className="text-center">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4A11E]">
                  Member Access
                </span>

                <h2 className="mt-2 text-xl font-medium tracking-tight text-neutral-950 sm:text-2xl">
                  Unlock Member Pricing
                </h2>

                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                  Free membership gives approved members access to member
                  pricing across the Ascend collection.
                </p>
              </div>
</div>
          </section>
        )}

        <FeaturedCompounds />
      </main>

      <Footer />
    </>
  );
}