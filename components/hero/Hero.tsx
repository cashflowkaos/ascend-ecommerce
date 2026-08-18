import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto flex min-h-[calc(100svh-76px)] max-w-[1400px] flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16 lg:min-h-[85vh]">

        <Image
          src="/logo/wordmark.png"
          alt="Ascend"
          width={900}
          height={180}
          priority
          className="mb-8 h-auto w-[280px] sm:mb-10 sm:w-[420px] md:w-[600px] lg:w-[760px]"
        />

        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D4A11E] sm:text-xs sm:tracking-[0.45em]">
          Precision &bull; Purity &bull; Professionalism
        </p>

        <h1 className="max-w-4xl text-[2.6rem] font-light leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl md:text-6xl lg:text-7xl">
          Premium Research Compounds
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:mt-8 sm:text-lg sm:leading-8">
          Explore a focused collection of research compounds selected for
          purity, consistency, and uncompromising quality.
        </p>

        <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:mt-14 sm:w-auto sm:max-w-none sm:flex-row sm:gap-5">
          <Link
            href="/compounds"
            className="rounded-full bg-[#D4A11E] px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#BE8F17]"
          >
            Browse Compounds
          </Link>

          <Link
            href="/about"
            className="rounded-full border border-neutral-300 px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-900 transition hover:border-[#D4A11E]"
          >
            Learn More
          </Link>
        </div>

      </div>
    </section>
  );
}
