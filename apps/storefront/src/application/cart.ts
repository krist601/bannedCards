import type { Cart, CatalogueItem } from "@/domain/commerce";

export function addToCart(cart: Cart, item: CatalogueItem): Cart {
  if (item.stock === 0 || item.price === null) return cart;
  const existing = cart.find((line) => line.id === item.id);
  if (!existing) return [...cart, { ...item, price: item.price, quantity: 1 }];

  return cart.map((line) => line.id === item.id
    ? { ...line, quantity: Math.min(line.quantity + 1, line.stock ?? Infinity) }
    : line);
}

export function setCartQuantity(cart: Cart, itemId: string, nextQuantity: number): Cart {
  if (nextQuantity < 1) return cart.filter((line) => line.id !== itemId);
  return cart.map((line) => line.id === itemId
    ? { ...line, quantity: Math.min(nextQuantity, line.stock ?? Infinity) }
    : line);
}

/** `out`: no stock left. `short`: fewer copies in stock than the shopper wants. Lines stay in the cart so the shopper can see and remove them. */
export type LineAvailability = "ok" | "short" | "out";
export function lineAvailability(line: Pick<Cart[number], "stock" | "quantity">): LineAvailability {
  if (line.stock === null) return "ok";
  if (line.stock <= 0) return "out";
  return line.quantity > line.stock ? "short" : "ok";
}
/** Quantity that can actually be bought today. */
export function purchasableQuantity(line: Pick<Cart[number], "stock" | "quantity">): number {
  return line.stock === null ? line.quantity : Math.max(0, Math.min(line.quantity, line.stock));
}
export const cartHasUnavailable = (cart: Cart) => cart.some(line => lineAvailability(line) !== "ok");

export function cartItemCount(cart: Cart): number {
  return cart.reduce((total, line) => total + purchasableQuantity(line), 0);
}

export function cartTotal(cart: Cart): number {
  return cart.reduce((total, line) => total + line.price * purchasableQuantity(line), 0);
}

export function isCart(value: unknown): value is Cart {
  return Array.isArray(value) && value.every((line) => {
    if (!line || typeof line !== "object") return false;
    return ["id", "name", "game", "kind", "set", "collection", "finish", "condition", "colors", "theme"].every(key => typeof line[key] === "string")
      && Number.isFinite(line.price) && line.price >= 0
      && Number.isInteger(line.quantity) && line.quantity > 0
      && (line.stock === null || (Number.isInteger(line.stock) && line.stock >= 0));
  });
}
