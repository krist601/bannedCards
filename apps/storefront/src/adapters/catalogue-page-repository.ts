import { demoMode } from "./commerce-repositories";
import { demoCatalogueRepository } from "./demo-catalogue-repository";
import { mapCatalogueCard } from "./medusa-repositories";
import { groupCards } from "@/application/group-cards";
import { filterCatalogue } from "@/application/filter-catalogue";
export type CatalogueQuery = { q: string; limit?: number; showOutOfStock: boolean; sets?: string[]; ranked?: string[]; sort?: "added" | "release" };
export async function loadCataloguePage(query: CatalogueQuery, offset: number, signal: AbortSignal) {
  const limit = query.limit ?? 40;
  if (demoMode) {
    const all = await demoCatalogueRepository.list();
    const filtered = filterCatalogue(all, query.q, query.ranked ? {kind:'hottest'} : query.sets ? {kind:'set',code:'',name:'',setCodes:query.sets} : {kind:'all'}, [], query.ranked ?? []);
    if (query.sort === 'added') filtered.sort((a,b)=>(b.attributes?.addedAt ?? '').localeCompare(a.attributes?.addedAt ?? ''));
    const groups = groupCards(filtered).filter(group => query.showOutOfStock || group.cards.some(card => card.stock !== 0));
    return { cards: groups.slice(offset, offset + limit).flatMap(group => group.cards), count: groups.length, nextOffset: offset + limit < groups.length ? offset + limit : null };
  }
  const params = new URLSearchParams({grouped:'true',limit:String(limit),offset:String(offset),q:query.q,showOutOfStock:String(query.showOutOfStock)});
  if (query.sets) params.set('sets',query.sets.join(','));
  if (query.sort) params.set('sort',query.sort);
  if (query.ranked) params.set('ranked',query.ranked.join(','));
  const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tcg/cards?${params}`, {headers:{'x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''},signal:AbortSignal.any([signal,AbortSignal.timeout(30000)]),cache:'no-store'});
  if (!response.ok) throw new Error('Unable to load cards. Please retry.');
  const page = await response.json() as {cards: Parameters<typeof mapCatalogueCard>[0][]; count:number; nextOffset:number|null};
  return {...page,cards:page.cards.map(mapCatalogueCard)};
}
