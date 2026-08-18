import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">

        <div className="grid gap-10 md:grid-cols-3 md:gap-12">

          <div>
            <h3 className="text-2xl font-light tracking-[0.2em] text-neutral-950">
              ASCEND
            </h3>

            <p className="mt-4 max-w-sm text-[15px] leading-7 text-neutral-600">
              Premium research compounds presented with a focus on quality,
              consistency, and professional standards.
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-8 md:border-t-0 md:pt-0">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900">
              Navigation
            </h4>

            <nav className="flex flex-col items-start gap-4">
              <Link
                href="/"
                className="text-[15px] text-neutral-700 transition hover:text-[#D4A11E]"
              >
                Home
              </Link>

              <Link
                href="/compounds"
                className="text-[15px] text-neutral-700 transition hover:text-[#D4A11E]"
              >
                Compounds
              </Link>

              <Link
                href="/about"
                className="text-[15px] text-neutral-700 transition hover:text-[#D4A11E]"
              >
                About
              </Link>

              <Link
                href="/contact"
                className="text-[15px] text-neutral-700 transition hover:text-[#D4A11E]"
              >
                Contact
              </Link>
            </nav>
          </div>

          <div className="border-t border-neutral-200 pt-8 md:border-t-0 md:pt-0">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900">
              Notice
            </h4>

            <p className="max-w-md text-[15px] leading-7 text-neutral-600">
              Products presented on this website are intended for laboratory
              and research purposes only.
            </p>
          </div>

        </div>

        <div className="mt-12 border-t border-neutral-200 pt-7 text-xs leading-6 text-neutral-500 sm:mt-16 sm:text-sm">
          &copy; 2026 Ascend Peptide Co. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
