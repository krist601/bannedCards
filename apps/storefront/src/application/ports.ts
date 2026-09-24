import type { Cart, CatalogueItem } from "@/domain/commerce";

/** Async outbound ports; no framework or vendor types cross this boundary. */
export interface CatalogueRepository {
  list(): Promise<CatalogueItem[]>;
}
export interface CartRepository {
  load(): Promise<Cart>;
  add(item: CatalogueItem, quantity?: number): Promise<Cart>;
  setQuantity(lineId: string, quantity: number): Promise<Cart>;
  clearLocal(): void;
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
