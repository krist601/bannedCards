import type { CatalogueItem } from "@/domain/commerce";
import type { CatalogueFilter } from "@/domain/set-directory";
import { orderCatalogue } from "./catalogue";
export function filterCatalogue(cards: CatalogueItem[], query: string, filter: CatalogueFilter, latest: string[], hottest: string[]): CatalogueItem[] {
  const ranks = new Map(hottest.map((id, index) => [id, index]));
  const items = cards.filter(card => {
    if (!`${card.name} ${card.set}`.toLowerCase().includes(query.toLowerCase())) return false;
    const code = card.setCode?.toLowerCase();
    if (filter.kind === "set") return Boolean(code && (filter.setCodes ?? [filter.code]).includes(code));
    if (filter.kind === "latest") return Boolean(code && latest.includes(code));
    if (filter.kind === "hottest") return ranks.has(card.attributes?.variantId ?? card.id);
    return true;
  });
  if (filter.kind === "hottest") return [...items].sort((a, b) => ranks.get(a.attributes?.variantId ?? a.id)! - ranks.get(b.attributes?.variantId ?? b.id)! || a.name.localeCompare(b.name));
  return orderCatalogue(items);
}
