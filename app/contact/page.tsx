import Header from "@/components/layout/Header";
import { hasStorefrontMemberAccess } from "@/lib/auth";
import Footer from "@/components/layout/Footer";
import { Mail, MapPin } from "lucide-react";

export default async function ContactPage() {
  const memberMode =
    await hasStorefrontMemberAccess();
  return (
    <>
      <Header memberMode={memberMode} />

      <main className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16 lg:py-24">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4A11E] sm:text-sm sm:tracking-[0.35em]">
            Contact
          </p>

          <h1 className="mt-4 text-4xl font-light leading-tight tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            Get In Touch
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:mt-7 sm:text-lg sm:leading-8">
            Questions regarding product availability, documentation, or general
            inquiries are welcome. We aim to respond promptly to legitimate
            requests.
          </p>

          <div className="mt-10 overflow-hidden rounded-[24px] border border-neutral-200 bg-white sm:mt-14 sm:rounded-3xl lg:mt-16">

            <div className="flex gap-4 border-b border-neutral-200 p-6 sm:gap-5 sm:p-8 lg:p-10">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-[#D4A11E]">
                <Mail size={20} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-600">
                  Email
                </h2>

                <a
                  href="mailto:support@ascendpepco.com"
                  className="mt-2 block break-all text-lg font-medium text-neutral-950 transition hover:text-[#D4A11E] sm:text-xl"
                >
                  support@ascendpepco.com
                </a>
              </div>

            </div>

            <div className="flex gap-4 p-6 sm:gap-5 sm:p-8 lg:p-10">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-[#D4A11E]">
                <MapPin size={20} strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-600">
                  Location
                </h2>

                <p className="mt-2 text-lg font-medium text-neutral-950 sm:text-xl">
                  Anaheim, California
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
