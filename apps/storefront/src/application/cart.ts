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

export function cartItemCount(cart: Cart): number {
  return cart.reduce((total, line) => total + line.quantity, 0);
}

export function cartTotal(cart: Cart): number {
  return cart.reduce((total, line) => total + line.price * line.quantity, 0);
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
