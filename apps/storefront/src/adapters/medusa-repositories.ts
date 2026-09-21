import type { CommerceRepositories } from "@/application/ports";
import type { Cart, CatalogueItem, Game, ProductKind } from "@/domain/commerce";

export type MedusaConfig = { url: string; publishableKey: string; regionId: string };
type Metadata = Record<string, unknown> | null;
type Variant = {
  id: string; metadata?: Metadata; inventory_quantity?: number;
  manage_inventory?: boolean; allow_backorder?: boolean;
  calculated_price?: { calculated_amount: number | null; currency_code: string };
};
type Product = { id: string; title: string; thumbnail?: string | null; metadata?: Metadata; variants?: Variant[] };
type CatalogueCard = {
  id: string; printing_id: string; listing_id: string | null; variant_id: string | null;
  name: string; set: string; set_code: string; collector_number: string; rarity: string | null;
  condition: string; language: string | null; finish: string; price_clp: number | null;
  stock: number; image_url: string | null; image_small_url: string | null;
  colors: string; collection: "Latest" | "Middle-earth"; external_id: string | null;
};
type RemoteCart = {
  id: string; region_id: string; currency_code: string; completed_at?: string | null;
  items?: { id: string; variant_id: string; title: string; quantity: number; unit_price: number;
    product?: Product; variant?: Variant }[];
};
class MedusaError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const games: Game[] = ["magic-the-gathering", "pokemon", "one-piece", "other"];
const kinds: ProductKind[] = ["single", "sealed", "accessory"];
export function mapItem(product: Product, variant: Variant, amount: number): CatalogueItem {
  const meta = { ...product.metadata, ...variant.metadata };
  const str = (key: string, fallback = "") => typeof meta[key] === "string" ? meta[key] as string : fallback;
  return {
    id: variant.id, name: product.title, game: games.includes(meta.game as Game) ? meta.game as Game : "other",
    kind: kinds.includes(meta.kind as ProductKind) ? meta.kind as ProductKind : "single",
    set: str("set"), setCode: str("set_code").toLowerCase(), collection: meta.collection === "Middle-earth" ? "Middle-earth" : "Latest",
    finish: str("finish", "Standard"), condition: str("condition", "See listing"), price: amount,
    stock: variant.manage_inventory === false || variant.allow_backorder ? null : variant.inventory_quantity ?? 0,
    imageUrl: str("image_url", product.thumbnail ?? "") || undefined,
    colors: str("colors"), theme: ["fae", "academy", "marvel", "ring", "shire", "mist"].includes(str("theme")) ? str("theme") : "mist"
  };
}

export function mapCatalogueCard(card: CatalogueCard): CatalogueItem {
  return {
    id: card.id,
    name: card.name,
    game: "magic-the-gathering",
    kind: "single",
    set: card.set,
    setCode: card.set_code.toLowerCase(),
    collection: card.collection,
    finish: card.finish,
    condition: card.condition,
    price: card.price_clp,
    stock: card.stock,
    imageUrl: card.image_url ?? card.image_small_url ?? undefined,
    colors: card.colors,
    theme: card.set_code.toLowerCase() === "ltr" ? "ring" : "mist",
    attributes: {
      printingId: card.printing_id,
      collectorNumber: card.collector_number,
      ...(card.listing_id ? { listingId: card.listing_id } : {}),
      ...(card.variant_id ? { variantId: card.variant_id } : {}),
      ...(card.rarity ? { rarity: card.rarity } : {}),
      ...(card.language ? { language: card.language } : {}),
      ...(card.external_id ? { scryfallId: card.external_id } : {})
    }
  };
}

/** Medusa owns prices, inventory validation and cart mutations. Only the cart ID is persisted. */
export function createMedusaRepositories(config: MedusaConfig, storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, fetcher: typeof fetch = fetch): CommerceRepositories {
  const key = `banned-cards-medusa-cart:${config.url}:${config.regionId}`;
  async function request<T>(path: string, method = "GET", body?: unknown, token?: string): Promise<T> {
    const response = await fetcher(`${config.url.replace(/\/$/, "")}${path}`, {
      signal: AbortSignal.timeout(15000), method, credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": config.publishableKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    if (!response.ok) {
      throw new MedusaError(response.status, response.status === 401 ? "Please sign in again." :
        response.status === 400 || response.status === 409 ? "Medusa could not accept this change. Check stock and try again." : "The store is unavailable. Please try again.");
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  }
  function mapCart(cart: RemoteCart): Cart {
    if (cart.currency_code.toLowerCase() !== "clp" || cart.region_id !== config.regionId) throw new Error("The store requires a Chilean CLP region.");
    return (cart.items ?? []).map(line => {
      const item = mapItem({ id: "", ...line.product, title: line.product?.title || line.title }, line.variant ?? { id: line.variant_id }, line.unit_price);
      return {
        ...item,
        id: line.variant_id,
        lineId: line.id,
        price: line.unit_price,
        quantity: line.quantity,
        // Cart responses need not include stock; the API validates every mutation.
        stock: null
      };
    });
  }
  async function current(): Promise<RemoteCart | null> {
    const id = storage.getItem(key);
    if (!id) return null;
    try {
      const { cart } = await request<{ cart: RemoteCart }>(`/store/carts/${encodeURIComponent(id)}`);
      if (cart.completed_at || cart.region_id !== config.regionId) { storage.removeItem(key); return null; }
      mapCart(cart);
      return cart;
    } catch (error) {
      if (error instanceof MedusaError && error.status === 404) { storage.removeItem(key); return null; }
      throw error;
    }
  }
  // Serialize mutations, including lazy creation, to prevent duplicate carts and stale responses.
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  }
  return {
    catalogue: { list: async () => {
      const items: CatalogueItem[] = [];
      let offset = 0;
      while (true) {
        const query = new URLSearchParams({ limit: "100", offset: String(offset) });
        const page = await request<{ cards: CatalogueCard[]; count: number; limit: number }>(`/store/tcg/cards?${query}`);
        items.push(...page.cards.map(mapCatalogueCard));
        offset += page.limit;
        if (!page.cards.length || offset >= page.count) break;
      }
      return items;
    } },
    cart: {
      load: () => serial(async () => { const cart = await current(); return cart ? mapCart(cart) : []; }),
      add: item => serial(async () => {
        let cart = await current();
        if (!cart) {
          ({ cart } = await request<{ cart: RemoteCart }>("/store/carts", "POST", { region_id: config.regionId }));
          mapCart(cart);
          storage.setItem(key, cart.id);
        }
        const result = await request<{ cart: RemoteCart }>(`/store/carts/${encodeURIComponent(cart.id)}/line-items`, "POST", { variant_id: item.id, quantity: 1 });
        return mapCart(result.cart);
      }),
      setQuantity: (lineId, quantity) => serial(async () => {
        if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Quantity must be a non-negative whole number.");
        const cart = await current();
        if (!cart) return [];
        const path = `/store/carts/${encodeURIComponent(cart.id)}/line-items/${encodeURIComponent(lineId)}`;
        if (quantity === 0) {
          await request(path, "DELETE");
          const refreshed = await current();
          return refreshed ? mapCart(refreshed) : [];
        }
        return mapCart((await request<{ cart: RemoteCart }>(path, "POST", { quantity })).cart);
      }),
      clearLocal: () => storage.removeItem(key)
    },
    customer: {
      load: async () => {
        try {
          const { customer } = await request<{ customer: { first_name?: string; email: string } }>("/store/customers/me");
          return customer.first_name || customer.email;
        } catch (error) { if (error instanceof MedusaError && error.status === 401) return ""; throw error; }
      },
      login: async (email, password) => {
        const { token } = await request<{ token: string }>("/auth/customer/emailpass", "POST", { email, password });
        await request("/auth/session", "POST", undefined, token);
        const { customer } = await request<{ customer: { first_name?: string; email: string } }>("/store/customers/me");
        return customer.first_name || customer.email;
      },
      clear: async () => { await request("/auth/session", "DELETE"); }
    }
  };
}
