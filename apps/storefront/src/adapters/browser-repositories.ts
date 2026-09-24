import { addToCart, isCart, setCartQuantity } from "@/application/cart";
import type { CartRepository, CustomerSessionRepository } from "@/application/ports";
import type { Cart } from "@/domain/commerce";
const cartKey = "banned-cards-cart";
const customerKey = "banned-cards-customer";
function load(): Cart {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(cartKey) ?? "[]");
    return isCart(value) ? value : [];
  } catch { return []; }
}
function save(cart: Cart): Cart {
  window.localStorage.setItem(cartKey, JSON.stringify(cart));
  return cart;
}
export const browserCartRepository: CartRepository = {
  load: async () => load(),
  add: async (item, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new Error("Invalid quantity.");
    let cart = load();
    for (let index = 0; index < quantity; index++) cart = addToCart(cart, item);
    return save(cart);
  },
  setQuantity: async (id, quantity) => save(setCartQuantity(load(), id, quantity)),
  clearLocal: () => window.localStorage.removeItem(cartKey)
};
export const browserCustomerSession: CustomerSessionRepository = {
  load: async () => window.localStorage.getItem(customerKey) ?? "",
  login: async (email) => {
    const name = email.split("@")[0];
    window.localStorage.setItem(customerKey, name);
    return name;
  },
  clear: async () => { window.localStorage.removeItem(customerKey); }
};
