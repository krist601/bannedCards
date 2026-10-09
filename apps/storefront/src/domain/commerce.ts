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
export type WebpayStart = { url: string; token: string };
export type WebpayOrderView = {
  id: string; display_id: number; total: number; currency_code: string; payment_status: "paid" | "not_paid";
  items: { title: string; quantity: number; unit_price: number; thumbnail: string | null }[];
  delivery: { name: string; phone?: string; address: string; address2?: string; comuna: string; region?: string; branch?: string } | null;
  document: { type: "boleta" | "factura"; rut: string; company?: { name: string } } | null; notes: string;
};
/** What the store says about a payment the shopper just finished (or abandoned) at Webpay. */
export type WebpayOutcome =
  | { status: "approved"; order: WebpayOrderView; email_sent: boolean; payment: { card_last4: string; authorization_code: string; installments: number; environment: string } }
  | { status: "rejected" | "aborted" | "review" | "unknown"; order?: WebpayOrderView; message?: string };
export type CartLine = Omit<CatalogueItem, "price"> & { price: number; quantity: number; lineId?: string };
export type Cart = CartLine[];
