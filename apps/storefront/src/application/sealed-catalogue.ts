import type { CatalogueItem } from '../domain/commerce';
export type SealedQuery = {q?:string;category?:string;set?:string;language?:string;collection?:string};
export function selectSealed(items:CatalogueItem[],query:SealedQuery) {
  const q=(query.q??'').trim().toLowerCase();
  return items.filter(item=>{
    const a=item.attributes??{};
    return (!q||`${item.name} ${item.set}`.toLowerCase().includes(q))
      && (!query.category||(a.categoryPaths??'').split(',').includes(query.category))
      && (!query.set||a.setSlug===query.set)
      && (!query.language||a.language===query.language)
      && (query.collection!=='almost-gone'||(item.stock!==null&&item.stock>0&&item.stock<=3))
      && (query.collection!=='deals'||(item.price!==null&&Number(a.originalPrice)>item.price));
  }).sort((a,b)=>query.collection==='almost-gone'?(a.stock??Infinity)-(b.stock??Infinity):
    (query.collection==='latest-releases' ? (b.attributes?.releasedAt??'').localeCompare(a.attributes?.releasedAt??'') : 0) ||
    (b.attributes?.addedAt??'').localeCompare(a.attributes?.addedAt??'')||a.id.localeCompare(b.id));
}
export function sealedSlug(value:string) {return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
