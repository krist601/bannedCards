import type { Cart, CatalogueItem } from "@/domain/commerce";

/** Outbound ports. Infrastructure implements these; use cases depend on them. */
export interface CatalogueRepository {
  list(): CatalogueItem[];
}

export interface CartRepository {
  load(): Cart;
  save(cart: Cart): void;
}

export interface CustomerSessionRepository {
  load(): string;
  save(name: string): void;
  clear(): void;
}
