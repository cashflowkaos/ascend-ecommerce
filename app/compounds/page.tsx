import Header from "@/components/layout/Header";
import FeaturedCompounds from "@/components/products/FeaturedCompounds";

export default function CompoundsPage() {
  return (
    <>
      <Header />

      <main className="bg-white min-h-screen">

        <section className="border-b border-neutral-200 py-24">
          <div className="mx-auto max-w-[1400px] px-10">

            <p className="text-sm uppercase tracking-[0.35em] text-[#D4A11E]">
              Ascend Collection
            </p>

            <h1 className="mt-4 text-6xl font-light">
              Research Compounds
            </h1>

            <p className="mt-8 max-w-3xl text-lg text-neutral-600">
              Browse our catalog of research compounds. Select a compound
              to view specifications and available options.
            </p>

          </div>
        </section>

        <FeaturedCompounds />

      </main>
    </>
  );
}