import type { Cart, CartLine, CatalogueItem } from "@/domain/commerce";

export function addToCart(cart: Cart, item: CatalogueItem): Cart {
  const existing = cart.find((line) => line.id === item.id);
  if (!existing) return [...cart, { ...item, quantity: 1 }];

  return cart.map((line) => line.id === item.id
    ? { ...line, quantity: Math.min(line.quantity + 1, line.stock) }
    : line);
}

export function setCartQuantity(cart: Cart, itemId: string, nextQuantity: number): Cart {
  if (nextQuantity < 1) return cart.filter((line) => line.id !== itemId);
  return cart.map((line) => line.id === itemId
    ? { ...line, quantity: Math.min(nextQuantity, line.stock) }
    : line);
}

export function cartItemCount(cart: Cart): number {
  return cart.reduce((total, line) => total + line.quantity, 0);
}

export function cartTotal(cart: Cart): number {
  return cart.reduce((total, line) => total + line.price * line.quantity, 0);
}

export function isCart(value: unknown): value is Cart {
  return Array.isArray(value) && value.every((line) => typeof (line as CartLine).id === "string");
}
