import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center px-10">

        {/* Logo */}

        <Link href="/" className="mr-16 flex items-center">
          <Image
            src="/logo/logo.png"
            alt="Ascend"
            width={250}
            height={95}
            priority
            className="h-16 w-auto"
          />
        </Link>

        {/* Navigation */}

        <nav className="hidden items-center gap-10 md:flex">
          <Link
            href="/compounds"
            className="text-sm font-medium uppercase tracking-[0.25em] transition hover:text-[#D4A11E]"
          >
            Compounds
          </Link>

          <Link
            href="/about"
            className="text-sm font-medium uppercase tracking-[0.25em] transition hover:text-[#D4A11E]"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-sm font-medium uppercase tracking-[0.25em] transition hover:text-[#D4A11E]"
          >
            Contact
          </Link>
        </nav>

        {/* Spacer */}

        <div className="flex-1" />

        {/* Cart */}

        <button className="flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2 transition hover:border-[#D4A11E]">
          <ShoppingCart size={19} />
          <span className="text-sm">(0)</span>
        </button>

      </div>
    </header>
  );
}