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
  added_at?: string | null;
  id: string; printing_id: string; listing_id: string | null; variant_id: string | null;
  name: string; set: string; set_code: string; collector_number: string; rarity: string | null;
  condition: string; language: string | null; finish: string; price_clp: number | null;
  stock: number; image_url: string | null; image_small_url: string | null;
  colors: string; collection: "Latest" | "Middle-earth"; external_id: string | null;
};
type RemoteCart = {
  id: string; region_id: string; currency_code: string; customer_id?: string | null; completed_at?: string | null;
  items?: { id: string; variant_id: string; title: string; variant_title?: string | null; quantity: number; unit_price: number; thumbnail?: string | null;
    product?: Product; variant?: Variant }[];
};
export type StockProblem = { variant_id: string; title: string; requested: number; available: number };
export class CheckoutFailed extends Error {
  constructor(public code: string, message: string, public problems: StockProblem[] = []) { super(message); }
}
class MedusaError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const games: Game[] = ["magic-the-gathering", "pokemon", "one-piece", "other"];
const kinds: ProductKind[] = ["single", "sealed", "accessory", "custom"];
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
      ...(card.added_at ? { addedAt: card.added_at } : {}),
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
  let customerId: string | null = null;
  const key = `banned-cards-medusa-cart:${config.url}:${config.regionId}:${config.publishableKey}`;
  const customerCartKey = `storefront_cart_${config.publishableKey}`;
  async function request<T>(path: string, method = "GET", body?: unknown, token?: string): Promise<T> {
    const response = await fetcher(`${config.url.replace(/\/$/, "")}${path}`, {
      signal: AbortSignal.timeout(15000), method, credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": config.publishableKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    if (!response.ok) {
      throw new MedusaError(response.status, response.status === 401 ? "Please sign in again." :
        response.status === 400 || response.status === 409 ? "There is not enough stock to make this change. Check the available quantity and try again." : "The store is unavailable. Please try again.");
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  }
  function mapCart(cart: RemoteCart): Cart {
    if (cart.currency_code.toLowerCase() !== "clp" || cart.region_id !== config.regionId) throw new Error("The store requires a Chilean CLP region.");
    return (cart.items ?? []).map(line => {
      const item = mapItem({ id: "", ...line.product, thumbnail:line.product?.thumbnail || line.thumbnail, title: line.product?.title || line.title }, line.variant ?? { id: line.variant_id }, line.unit_price);
      // Singles carry "near_mint / English / non_foil" in the variant title; show it instead of generic defaults.
      const parts = (line.variant_title ?? "").split(" / ");
      const pretty = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()).replace("Non Foil", "Non-foil");
      const card = parts.length === 3 && /^[a-z_]+$/.test(parts[0]) && /^[a-z_]+$/.test(parts[2]);
      return {
        ...item,
        ...(card ? { finish: pretty(parts[2]), condition: pretty(parts[0]), attributes: { ...item.attributes, language: parts[1] } } : {}),
        id: line.variant_id,
        lineId: line.id,
        price: line.unit_price,
        quantity: line.quantity,
        // Cart responses need not include stock; the API validates every mutation.
        stock: null
      };
    });
  }
  /** Cart responses carry no stock; ask the store how many of each line are left so sold-out lines can be flagged instead of failing at checkout. */
  async function withAvailability(cart: Cart): Promise<Cart> {
    if (!cart.length) return cart;
    try {
      const { availability } = await request<{ availability: Record<string, number | null> }>(`/store/cart-availability?variant_ids=${cart.map(line => encodeURIComponent(line.id)).join(",")}`);
      return cart.map(line => ({ ...line, stock: typeof availability[line.id] === "number" ? availability[line.id] : line.stock }));
    } catch { return cart; }
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
      if (error instanceof MedusaError && [403,404].includes(error.status)) { storage.removeItem(key); return null; }
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
  async function saveCustomerCart(cart: RemoteCart) {
    if (!customerId) return;
    if (cart.customer_id && cart.customer_id !== customerId) throw new Error("This cart belongs to another account.");
    if (!cart.customer_id) await request(`/store/carts/${encodeURIComponent(cart.id)}/customer`, "POST", {});
    await request("/store/customers/me", "POST", {metadata:{[customerCartKey]:cart.id}});
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
      syncCustomer: () => serial(async () => {
        if (!customerId) { const cart=await current(); return cart?withAvailability(mapCart(cart)):[]; }
        const {customer}=await request<{customer:{metadata?:Record<string,unknown>}}>("/store/customers/me");
        let local=await current();
        if(local?.customer_id && local.customer_id!==customerId){storage.removeItem(key);local=null;}
        const savedId=customer.metadata?.[customerCartKey] ?? customer.metadata?.storefront_cart_id;
        if(typeof savedId==="string" && savedId!==local?.id){
          try {
            const {cart:saved}=await request<{cart:RemoteCart}>(`/store/carts/${encodeURIComponent(savedId)}`);
            if(saved.customer_id===customerId && !saved.completed_at && saved.region_id===config.regionId){
              // Keep the larger quantity per variant: retrying a partial merge cannot double items.
              for(const line of local?.items??[]){
                const existing=saved.items?.find(item=>item.variant_id===line.variant_id);
                if(existing && existing.quantity>=line.quantity)continue;
                const path=existing?`/store/carts/${encodeURIComponent(saved.id)}/line-items/${encodeURIComponent(existing.id)}`:`/store/carts/${encodeURIComponent(saved.id)}/line-items`;
                const result=await request<{cart:RemoteCart}>(path,"POST",existing?{quantity:line.quantity}:{variant_id:line.variant_id,quantity:line.quantity});
                saved.items=result.cart.items;
              }
              local=saved;storage.setItem(key,saved.id);
            }
          }catch(error){if(!(error instanceof MedusaError && [403,404].includes(error.status)))throw error;}
        }
        if(local)await saveCustomerCart(local);
        return local?withAvailability(mapCart(local)):[];
      }),
      load: () => serial(async () => { const cart = await current(); return cart ? withAvailability(mapCart(cart)) : []; }),
      add: (item, quantity = 1) => serial(async () => {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new Error("Quantity must be between 1 and 999.");
        let cart = await current();
        if (!cart) {
          ({ cart } = await request<{ cart: RemoteCart }>("/store/carts", "POST", { region_id: config.regionId }));
          mapCart(cart);
          storage.setItem(key, cart.id);
        }
        await saveCustomerCart(cart);
        const result = await request<{ cart: RemoteCart }>(`/store/carts/${encodeURIComponent(cart.id)}/line-items`, "POST", { variant_id: item.id, quantity });
        return withAvailability(mapCart(result.cart));
      }),
      setQuantity: (lineId, quantity) => serial(async () => {
        if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Quantity must be a non-negative whole number.");
        const cart = await current();
        if (!cart) return [];
        const path = `/store/carts/${encodeURIComponent(cart.id)}/line-items/${encodeURIComponent(lineId)}`;
        if (quantity === 0) {
          await request(path, "DELETE");
          const refreshed = await current();
          return refreshed ? withAvailability(mapCart(refreshed)) : [];
        }
        return withAvailability(mapCart((await request<{ cart: RemoteCart }>(path, "POST", { quantity })).cart));
      }),
      checkout: (contact, locale) => serial(async () => {
        const cart = await current();
        if (!cart) throw new CheckoutFailed("cart_empty", "Your cart is empty.");
        const response = await fetcher(`${config.url.replace(/\/$/, "")}/store/test-checkout`, {
          signal: AbortSignal.timeout(30000), method: "POST", credentials: "include", cache: "no-store",
          headers: { "Content-Type": "application/json", "x-publishable-api-key": config.publishableKey },
          body: JSON.stringify({ cart_id: cart.id, contact, locale })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new CheckoutFailed(String(body.code ?? "checkout_failed"), String(body.message ?? "The order could not be placed."), Array.isArray(body.problems) ? body.problems : []);
        storage.removeItem(key);
        const order = body.order;
        return { id: order.id, displayId: order.display_id, total: order.total, currency: order.currency_code, paymentStatus: order.payment_status === "paid" ? "paid" : "not_paid", emailSent: body.email_sent === true,
          items: ((order.items ?? []) as { title: string; quantity: number; unit_price: number }[]).map(item => ({ title: item.title, quantity: item.quantity, unitPrice: item.unit_price })) };
      }),
      clearLocal: () => storage.removeItem(key)
    },
    customer: {
      load: async () => {
        try {
          const { customer } = await request<{ customer: { id?:string; first_name?: string; email: string } }>("/store/customers/me");
          customerId=customer.id??null;
          return customer.first_name || customer.email;
        } catch (error) { if (error instanceof MedusaError && error.status === 401) return ""; throw error; }
      },
      login: async (email, password) => {
        let token: string;
        try { ({ token } = await request<{ token: string }>("/auth/customer/emailpass", "POST", { email, password })); }
        catch (error) { throw error instanceof MedusaError && error.status === 401 ? new Error("Email or password is incorrect.") : error; }
        await request("/auth/session", "POST", undefined, token);
        const { customer } = await request<{ customer: { id?:string; first_name?: string; email: string } }>("/store/customers/me");
        customerId=customer.id??null;
          return customer.first_name || customer.email;
      },
      clear: async () => { await request("/auth/session", "DELETE"); customerId=null; }
    }
  };
}
