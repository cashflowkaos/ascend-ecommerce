import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="bg-white min-h-screen">
        <section className="mx-auto max-w-4xl px-8 py-24">

          <p className="text-sm uppercase tracking-[0.35em] text-[#D4A11E]">
            Contact
          </p>

          <h1 className="mt-4 text-6xl font-light">
            Get In Touch
          </h1>

          <p className="mt-8 text-lg leading-8 text-neutral-600">
            Questions regarding product availability, documentation, or general
            inquiries are always welcome. We aim to respond promptly to all
            legitimate requests.
          </p>

          <div className="mt-16 space-y-10 rounded-3xl border border-neutral-200 p-10">

            <div>
              <h3 className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                Email
              </h3>

              <p className="mt-2 text-xl">
                ascendpepco@gmail.com
              </p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                Location
              </h3>

              <p className="mt-2 text-xl">
                Anaheim, California
              </p>
            </div>

          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}