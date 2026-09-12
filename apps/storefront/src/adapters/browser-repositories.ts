import { isCart } from "@/application/cart";
import type { CartRepository, CustomerSessionRepository } from "@/application/ports";
import type { Cart } from "@/domain/commerce";

const cartKey = "banned-cards-cart";
const customerKey = "banned-cards-customer";

export const browserCartRepository: CartRepository = {
  load: () => {
    const raw = window.localStorage.getItem(cartKey);
    if (!raw) return [];
    try {
      const value: unknown = JSON.parse(raw);
      return isCart(value) ? value : [];
    } catch { return []; }
  },
  save: (cart: Cart) => window.localStorage.setItem(cartKey, JSON.stringify(cart))
};

export const browserCustomerSession: CustomerSessionRepository = {
  load: () => window.localStorage.getItem(customerKey) ?? "",
  save: (name) => window.localStorage.setItem(customerKey, name),
  clear: () => window.localStorage.removeItem(customerKey)
};
