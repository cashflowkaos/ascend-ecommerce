import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="bg-white min-h-screen">
        <section className="mx-auto max-w-5xl px-8 py-24">

          <p className="text-sm uppercase tracking-[0.35em] text-[#D4A11E]">
            About Ascend
          </p>

          <h1 className="mt-4 text-6xl font-light tracking-tight">
            Precision. Quality. Professional Presentation.
          </h1>

          <div className="mt-12 space-y-8 text-lg leading-9 text-neutral-600">

            <p>
              Ascend Peptide Co. was founded with a simple objective: provide
              research compounds presented with exceptional attention to
              quality, consistency, and professional laboratory aesthetics.
            </p>

            <p>
              Every product is presented with clean labeling, organized
              documentation, and a modern scientific identity designed for
              laboratories, educational environments, and qualified research
              professionals.
            </p>

            <p>
              We believe professional presentation reflects professional
              standards. From product imagery to documentation and packaging,
              every detail is approached with consistency and precision.
            </p>

          </div>

          <div className="mt-20 rounded-3xl border border-neutral-200 bg-neutral-50 p-10">

            <h2 className="text-2xl font-medium">
              Research Notice
            </h2>

            <p className="mt-5 leading-8 text-neutral-600">
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