"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search } from "lucide-react";

import {
  addToCart,
} from "@/lib/cart/cart";

type DistroCatalogItem = {
  id: string;
  sku: string;
  name: string;
  description: string;
  available: boolean;
  price: number | null;
};

type Props = {
  products: DistroCatalogItem[];
};

export default function DistroCatalog({
  products,
}: Props) {
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<
    Record<string, number>
  >({});
  const [addedId, setAddedId] = useState<string | null>(
    null
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search)
      );
    });
  }, [products, query]);

  function quantityFor(id: string) {
    return Math.max(1, quantities[id] ?? 1);
  }

  function changeQuantity(
    id: string,
    amount: number
  ) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(
        1,
        (current[id] ?? 1) + amount
      ),
    }));
  }

  function addProduct(product: DistroCatalogItem) {
    if (
      !product.available ||
      product.price === null
    ) {
      return;
    }

    addToCart({
      productId: product.id,
      variantId: `distro:${product.id}`,
      slug: "distro",
      productName: product.name,
      strength: "Distro",
      sku: product.sku,
      unitPrice: product.price,
      quantity: quantityFor(product.id),
      image: null,
    });

    setAddedId(product.id);

    window.setTimeout(() => {
      setAddedId((current) =>
        current === product.id ? null : current
      );
    }, 1500);
  }

  return (
    <>
      <div className="distro-search-shell">
        <Search size={17} />

        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search compound or SKU..."
          autoComplete="off"
        />
      </div>

      <section className="distro-catalog distro-buy-catalog">
        <div className="distro-buy-head">
          <span>Compound</span>
          <span>SKU</span>
          <span>Availability</span>
          <span>Price</span>
          <span>Qty</span>
          <span />
        </div>

        {filtered.map((product) => {
          const quantity = quantityFor(product.id);
          const added = addedId === product.id;

          return (
            <div
              key={product.id}
              className="distro-buy-row"
            >
              <div className="distro-buy-product">
                <strong>{product.name}</strong>

                {product.description && (
                  <span>
                    {product.description}
                  </span>
                )}
              </div>

              <div className="distro-buy-sku">
                {product.sku}
              </div>

              <div
                className={
                  product.available
                    ? "distro-availability distro-available"
                    : "distro-availability distro-unavailable"
                }
              >
                {product.available
                  ? "Available"
                  : "Out of Stock"}
              </div>

              <strong className="distro-buy-price">
                {product.price === null
                  ? "Contact"
                  : `$${product.price.toFixed(2)}`}
              </strong>

              <div className="distro-buy-qty">
                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(product.id, -1)
                  }
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} />
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(product.id, 1)
                  }
                  aria-label="Increase quantity"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button
                type="button"
                className="distro-buy-button"
                disabled={
                  !product.available ||
                  product.price === null
                }
                onClick={() => addProduct(product)}
              >
                {added ? (
                  <>
                    <Check size={14} />
                    Added
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="distro-empty">
            No compounds match your search.
          </div>
        )}
      </section>
    </>
  );
}