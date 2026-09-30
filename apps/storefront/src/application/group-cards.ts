import type { CatalogueItem } from "@/domain/commerce";
export type CardGroup = { id: string; cards: CatalogueItem[] };
export function conditionCode(value: string): string {
  const normalized = value.toLowerCase().replace(/[_-]/g, " ").trim();
  const codes: Record<string, string> = { "near mint": "NM", "lightly played": "LP", "moderately played": "MP", "heavily played": "HP", damaged: "DMG" };
  return codes[normalized] ?? value.toUpperCase();
}
/** Only condition and finish may differ. Missing printing/art identity never merges unrelated listings. */
export function groupCards(cards: CatalogueItem[]): CardGroup[] {
  const groups = new Map<string, CardGroup[]>();
  const ordered: CardGroup[] = [];
  for (const card of cards) {
    const attributes = card.attributes;
    const art = attributes?.printingId || attributes?.scryfallId || card.imageUrl;
    const key = card.kind === "single" && art && attributes?.collectorNumber
      ? JSON.stringify([card.game, card.name, card.setCode ?? card.set, attributes.collectorNumber, art, card.imageUrl, attributes.language?.toLowerCase() ?? "unknown"])
      : card.id;
    const candidates = groups.get(key) ?? [];
    let group = candidates.find(candidate => !candidate.cards.some(item => item.finish === card.finish && conditionCode(item.condition) === conditionCode(card.condition)));
    if (!group) {
      group = { id: card.id, cards: [] };
      candidates.push(group); groups.set(key, candidates); ordered.push(group);
    }
    group.cards.push(card);
  }
  return ordered;
}
