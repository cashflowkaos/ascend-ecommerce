import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FeaturedCompounds from "@/components/products/FeaturedCompounds";

export default function CompoundsPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-white">

        <section className="mx-auto max-w-[1400px] px-8 py-20 text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#D4A11E]">
            COLLECTION
          </p>

          <h1 className="mt-5 text-6xl font-light tracking-tight">
            Research Compounds
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-neutral-600">
            Browse our catalog of professionally presented research compounds,
            developed with a clean laboratory aesthetic and consistent product
            presentation.
          </p>

        </section>

        <FeaturedCompounds />

      </main>

      <Footer />
    </>
  );
}