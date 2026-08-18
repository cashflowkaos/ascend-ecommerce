import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16 lg:py-24">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4A11E] sm:text-sm sm:tracking-[0.35em]">
            About Ascend
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-light leading-[1.1] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            Precision. Quality. Professional Standards.
          </h1>

          <div className="mt-8 max-w-4xl space-y-6 text-base leading-8 text-neutral-600 sm:mt-10 sm:space-y-8 sm:text-lg sm:leading-9">

            <p>
              Ascend Peptide Co. was founded with a focused objective: provide
              research compounds with exceptional attention to quality,
              consistency, and precision.
            </p>

            <p>
              Our catalog is built around carefully presented research
              compounds, clear product information, and a consistent standard
              across the Ascend collection.
            </p>

            <p>
              We believe quality should be reflected in every detail. From
              product presentation and documentation to the overall customer
              experience, Ascend is built around consistency and professional
              standards.
            </p>

          </div>

          <div className="mt-12 rounded-[24px] border border-neutral-200 bg-neutral-50 p-6 sm:mt-16 sm:rounded-3xl sm:p-8 lg:mt-20 lg:p-10">

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4A11E]">
              Important Information
            </p>

            <h2 className="mt-3 text-2xl font-medium text-neutral-950">
              Research Notice
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-neutral-600 sm:mt-5 sm:text-base sm:leading-8">
              Products presented on this website are intended for laboratory
              research and analytical purposes. Users are responsible for
              ensuring compliance with all applicable laws, regulations, and
              institutional requirements within their jurisdiction.
            </p>

          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}
