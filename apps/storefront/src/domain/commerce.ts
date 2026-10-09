/**
 * Framework-free business language. Neither Next.js nor Medusa belongs here.
 */
export type Game = "magic-the-gathering" | "pokemon" | "one-piece" | "other";
export type ProductKind = "single" | "sealed" | "accessory" | "custom";
export type Collection = "All" | "Latest" | "Middle-earth";

export type CatalogueItem = {
  id: string;
  game: Game;
  kind: ProductKind;
  name: string;
  set: string;
  setCode?: string;
  collection: Exclude<Collection, "All">;
  finish: string;
  condition: string;
  price: number | null;
  stock: number | null;
  imageUrl?: string;
  colors: string;
  theme: string;
  /** Flexible game-specific data, e.g. collector number or Pokémon rarity. */
  attributes?: Record<string, string>;
};

export type CheckoutCompany = { rut: string; name: string; activity: string; address: string; comuna: string };
/** Delivery and tax-document data. \`city\` is the comuna. Everything is optional so the older, shorter form keeps working. */
export type CheckoutContact = {
  name?: string; lastName?: string; phone?: string; address?: string; address2?: string; city?: string; region?: string; branch?: string; notes?: string;
  document?: "boleta" | "factura"; rut?: string; company?: CheckoutCompany; shipping?: "starken";
};
export type PlacedOrder = { id: string; displayId: number; total: number; currency: string; paymentStatus: "paid" | "not_paid"; emailSent: boolean; items: { title: string; quantity: number; unitPrice: number }[] };
export type CartLine = Omit<CatalogueItem, "price"> & { price: number; quantity: number; lineId?: string };
export type Cart = CartLine[];
