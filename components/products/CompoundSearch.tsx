"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "./ProductCard";

type Product = React.ComponentProps<
  typeof ProductCard
>["product"];

export default function CompoundSearch({
  products,
}: {
  products: Product[];
}) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const searchable = product.name.toLowerCase();

      return searchable.includes(query);
    });
  }, [products, search]);

  return (
    <>
      <div className="mx-auto mb-10 max-w-2xl sm:mb-12">
        <div className="relative">
          <Search
            size={19}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search compounds..."
            autoComplete="off"
            className="w-full rounded-full border border-neutral-200 bg-white py-4 pl-13 pr-12 text-[15px] text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-[#D4A11E] focus:ring-4 focus:ring-[#D4A11E]/10 sm:py-[18px] sm:text-base"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-900"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {search && (
          <p className="mt-3 text-center text-xs text-neutral-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "compound"
              : "compounds"}{" "}
            found
          </p>
        )}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-neutral-900">
            No compounds found
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Try searching for a different compound.
          </p>
        </div>
      )}
    </>
  );
}
