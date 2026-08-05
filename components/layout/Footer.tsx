import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-10 py-16">

        <div className="grid gap-12 md:grid-cols-3">

          <div>
            <h3 className="text-2xl font-light tracking-[0.2em]">
              ASCEND
            </h3>

            <p className="mt-5 max-w-sm leading-7 text-neutral-600">
              Premium research compounds presented with a modern laboratory
              aesthetic and professional product documentation.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.3em]">
              Navigation
            </h4>

            <div className="space-y-3">
              <Link href="/">Home</Link><br />
              <Link href="/compounds">Compounds</Link><br />
              <Link href="/about">About</Link><br />
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.3em]">
              Notice
            </h4>

            <p className="leading-7 text-neutral-600">
              Products presented on this website are intended for laboratory
              and research purposes only.
            </p>
          </div>

        </div>

        <div className="mt-16 border-t border-neutral-200 pt-8 text-sm text-neutral-500">

          © 2026 Ascend Peptide Co. All rights reserved.

        </div>

      </div>
    </footer>
  );
}