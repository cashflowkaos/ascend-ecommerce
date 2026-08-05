import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto flex min-h-[85vh] max-w-[1400px] flex-col items-center justify-center px-8 text-center">

        <Image
  src="/logo/wordmark.png"
  alt="Ascend"
  width={900}
  height={180}
  priority
  className="mb-10 h-auto w-[520px] md:w-[760px]"
/>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.45em] text-[#D4A11E]">
          Precision • Purity • Professionalism
        </p>

        <h1 className="max-w-4xl text-5xl font-light tracking-tight text-neutral-900 md:text-7xl">
          Premium Research Compounds
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-600">
          A curated catalog of high-quality research compounds presented
          with clarity, consistency, and a modern laboratory aesthetic.
        </p>

        <div className="mt-14 flex gap-5">
          <Link
            href="/compounds"
            className="rounded-full bg-[#D4A11E] px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#BE8F17]"
          >
            Browse Compounds
          </Link>

          <Link
            href="/about"
            className="rounded-full border border-neutral-300 px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] transition hover:border-[#D4A11E]"
          >
            Learn More
          </Link>
        </div>

      </div>
    </section>
  );
}