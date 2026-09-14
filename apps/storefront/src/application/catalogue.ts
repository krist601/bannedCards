import type { CatalogueItem } from "@/domain/commerce";

export function isOutOfStock(item: CatalogueItem): boolean {
  return item.stock === 0;
}

/** Available items come first by descending price; sold-out items always follow. */
export function orderCatalogue(items: readonly CatalogueItem[]): CatalogueItem[] {
  return [...items].sort((left, right) => {
    const availability = Number(isOutOfStock(left)) - Number(isOutOfStock(right));
    if (availability !== 0) return availability;
    if (left.price === null && right.price !== null) return 1;
    if (left.price !== null && right.price === null) return -1;
    if (left.price === null || right.price === null) return left.name.localeCompare(right.name);
    if (left.price !== right.price) return right.price - left.price;
    return left.name.localeCompare(right.name);
  });
}
