/**
 * Framework-free business language. Neither Next.js nor Medusa belongs here.
 */
export type Game = "magic-the-gathering" | "pokemon" | "one-piece" | "other";
export type ProductKind = "single" | "sealed" | "accessory";
export type Collection = "All" | "Latest" | "Middle-earth";

export type CatalogueItem = {
  id: string;
  game: Game;
  kind: ProductKind;
  name: string;
  set: string;
  collection: Exclude<Collection, "All">;
  finish: string;
  condition: string;
  price: number;
  stock: number;
  colors: string;
  theme: string;
  /** Flexible game-specific data, e.g. collector number or Pokémon rarity. */
  attributes?: Record<string, string>;
};

export type CartLine = CatalogueItem & { quantity: number };
export type Cart = CartLine[];
