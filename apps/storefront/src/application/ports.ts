import type { Cart, CatalogueItem, CheckoutContact, PlacedOrder, WebpayStart } from "@/domain/commerce";

/** Async outbound ports; no framework or vendor types cross this boundary. */
export interface CatalogueRepository {
  list(): Promise<CatalogueItem[]>;
}
export interface CartRepository {
  load(): Promise<Cart>;
  add(item: CatalogueItem, quantity?: number): Promise<Cart>;
  setQuantity(lineId: string, quantity: number): Promise<Cart>;
  clearLocal(): void;
  syncCustomer?(): Promise<Cart>;
  /** Places an order from the saved cart (test checkout: no payment). Throws CheckoutFailed with the products that ran out. */
  checkout?(contact: CheckoutContact, locale: "es" | "en"): Promise<PlacedOrder>;
  /** Creates the order (stock reserved) and asks Webpay for a payment link. The cart stays open until the payment is approved. */
  startWebpay?(contact: CheckoutContact, locale: "es" | "en"): Promise<WebpayStart>;
}
export interface CustomerSessionRepository {
  load(): Promise<string>;
  login(email: string, password: string): Promise<string>;
  clear(): Promise<void>;
}
export interface CommerceRepositories {
  catalogue: CatalogueRepository;
  cart: CartRepository;
  customer: CustomerSessionRepository;
}
