const demoMode = process.env.NEXT_PUBLIC_COMMERCE_MODE === "demo";
import { mapItem } from './medusa-repositories';
import type { CatalogueItem } from '@/domain/commerce';

type Product = Parameters<typeof mapItem>[0];
type SealedProduct = Omit<Product, 'variants'> & { variants?: (NonNullable<Product['variants']>[number] & { title?: string })[] };

/** Category filtering is performed by Medusa before pagination. */
export async function loadSealedPage(q: string, offset: number, signal: AbortSignal) {
  if (demoMode) return { items: [] as CatalogueItem[], count: 0, nextOffset: null as number | null };
  const request = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}${path}`, {
      headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]), cache: 'no-store'
    });
    if (!response.ok) throw new Error('Unable to load sealed products. Please retry.');
    return response.json();
  };
  const { product_categories } = await request<{product_categories: {id: string}[]}>(
    '/store/product-categories?handle=sealed-products&limit=1');
  if (!product_categories.length) return {items: [] as CatalogueItem[], count: 0, nextOffset: null};
  const limit = 24;
  const params = new URLSearchParams({
    'category_id[0]': product_categories[0].id, limit: String(limit), offset: String(offset),
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? '', order: '-created_at',
    fields: '+metadata,+variants.metadata,*variants.calculated_price,+variants.inventory_quantity', ...(q ? {q} : {})
  });
  const {products, count} = await request<{products: SealedProduct[]; count: number}>(`/store/products?${params}`);
  const items = products.flatMap(product => (product.variants ?? []).map(variant => {
    const amount = variant.calculated_price;
    const item = mapItem(product, variant, amount?.calculated_amount ?? 0);
    return {...item, kind: 'sealed' as const,
      name: variant.title && variant.title !== 'Default variant' && variant.title !== 'Default Variant' ? `${product.title} — ${variant.title}` : product.title,
      price: amount?.currency_code?.toLowerCase() === 'clp' ? amount.calculated_amount : null,
      finish: 'Sealed', condition: 'Factory sealed'};
  }));
  return {items, count, nextOffset: offset + limit < count ? offset + limit : null};
}
