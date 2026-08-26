export const CART_STORAGE_KEY = "ascend_member_cart";
export const CART_CHANGED_EVENT = "ascend-cart-changed";

export type CartItem = {
  productId: string;
  variantId: string;

  slug: string;
  productName: string;
  strength: string;
  sku: string | null;

  unitPrice: number;
  quantity: number;

  image: string | null;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.floor(quantity));
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;

  return (
    typeof item.productId === "string" &&
    typeof item.variantId === "string" &&
    typeof item.slug === "string" &&
    typeof item.productName === "string" &&
    typeof item.strength === "string" &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity)
  );
}

export function getCart(): CartItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      CART_STORAGE_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isCartItem)
      .map((item) => ({
        ...item,
        quantity: normalizeQuantity(item.quantity),
      }));
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(
    new Event(CART_CHANGED_EVENT)
  );
}

export function addToCart(
  item: CartItem
): CartItem[] {
  const cart = getCart();

  const existingIndex = cart.findIndex(
    (existing) =>
      existing.variantId === item.variantId
  );

  if (existingIndex >= 0) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity:
        cart[existingIndex].quantity +
        normalizeQuantity(item.quantity),
    };
  } else {
    cart.push({
      ...item,
      quantity: normalizeQuantity(item.quantity),
    });
  }

  saveCart(cart);

  return cart;
}

export function setCartQuantity(
  variantId: string,
  quantity: number
): CartItem[] {
  const cart = getCart();

  const normalized = Math.floor(quantity);

  const updated =
    normalized <= 0
      ? cart.filter(
          (item) => item.variantId !== variantId
        )
      : cart.map((item) =>
          item.variantId === variantId
            ? {
                ...item,
                quantity:
                  normalizeQuantity(normalized),
              }
            : item
        );

  saveCart(updated);

  return updated;
}

export function removeFromCart(
  variantId: string
): CartItem[] {
  const updated = getCart().filter(
    (item) => item.variantId !== variantId
  );

  saveCart(updated);

  return updated;
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function getCartSubtotal() {
  return getCart().reduce(
    (total, item) =>
      total + item.unitPrice * item.quantity,
    0
  );
}