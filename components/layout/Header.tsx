"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { CART_CHANGED_EVENT, getCartCount } from "@/lib/cart/cart";
import { memberSignOut } from "@/app/account/actions";

type HeaderProps = {
  memberMode?: boolean;
};

export default function Header({
  memberMode = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!memberMode) {
      setCartCount(0);
      return;
    }

    const updateCartCount = () => {
      setCartCount(getCartCount());
    };

    updateCartCount();

    window.addEventListener(
      CART_CHANGED_EVENT,
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        CART_CHANGED_EVENT,
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, [memberMode]);

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
          <div className="hidden items-center gap-2 md:flex">
            {memberMode ? (
              <>
                <Link
                  href="/cart"
                  className="flex h-11 items-center gap-2 rounded-full border border-[#D4A11E] bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#b98b17]"
                >
                  <ShoppingCart size={16} strokeWidth={1.8} />
                  Cart ({cartCount})
                </Link>

                <Link
                  href="/account"
                  className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:border-[#D4A11E] hover:text-[#D4A11E]"
                >
                  <UserRound size={16} strokeWidth={1.8} />
                  My Account
                </Link>

                <form action={memberSignOut}>
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:border-[#D4A11E] hover:text-[#D4A11E]"
                  >
                    <LogOut size={16} strokeWidth={1.8} />
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="flex h-11 items-center rounded-full border border-neutral-300 bg-white px-5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:border-[#D4A11E] hover:text-[#D4A11E]"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="flex h-11 items-center rounded-full border border-[#D4A11E] bg-[#D4A11E] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#b98b17]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={
              menuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
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
              className="border-b border-neutral-100 py-5 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-900"
            >
              Contact
            </Link>

            {memberMode ? (
              <div className="grid gap-3 py-5 sm:grid-cols-3">
                <Link
                  href="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#D4A11E] bg-[#D4A11E] text-xs font-semibold uppercase tracking-[0.16em] text-white"
                >
                  <ShoppingCart size={16} strokeWidth={1.8} />
                  Cart ({cartCount})
                </Link>

                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-300 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900"
                >
                  <UserRound size={16} strokeWidth={1.8} />
                  Account
                </Link>

                <form action={memberSignOut}>
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900"
                  >
                    <LogOut size={16} strokeWidth={1.8} />
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-5">
                <Link
                  href="/signin"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full border border-neutral-300 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full border border-[#D4A11E] bg-[#D4A11E] text-xs font-semibold uppercase tracking-[0.16em] text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}