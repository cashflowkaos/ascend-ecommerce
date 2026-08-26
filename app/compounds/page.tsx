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

        <FeaturedCompounds />

      </main>

      <Footer />
    </>
  );
}
