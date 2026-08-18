"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingCart, X } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center px-4 sm:px-6 md:h-20 md:px-10">

        <Link
          href="/"
          className="flex shrink-0 items-center"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/logo/logo.png"
            alt="Ascend"
            width={250}
            height={95}
            priority
            className="h-[52px] w-auto sm:h-14 md:h-16"
          />
        </Link>

        <nav className="ml-16 hidden items-center gap-10 md:flex">
          <Link
            href="/compounds"
            className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-900 transition hover:text-[#D4A11E]"
          >
            Compounds
          </Link>

          <Link
            href="/about"
            className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-900 transition hover:text-[#D4A11E]"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-900 transition hover:text-[#D4A11E]"
          >
            Contact
          </Link>
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2">

          <button
            type="button"
            aria-label="Shopping cart"
            className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 text-neutral-900 transition hover:border-[#D4A11E] sm:px-4 md:px-5"
          >
            <ShoppingCart size={19} strokeWidth={1.8} />
            <span className="text-sm font-medium">(0)</span>
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 md:hidden"
          >
            {menuOpen ? (
              <X size={21} strokeWidth={1.8} />
            ) : (
              <Menu size={22} strokeWidth={1.8} />
            )}
          </button>

        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-5 py-3">

            <Link
              href="/compounds"
              onClick={() => setMenuOpen(false)}
              className="border-b border-neutral-100 py-5 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-900"
            >
              Compounds
            </Link>

            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="border-b border-neutral-100 py-5 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-900"
            >
              About
            </Link>

            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="py-5 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-900"
            >
              Contact
            </Link>

          </nav>
        </div>
      )}
    </header>
  );
}
