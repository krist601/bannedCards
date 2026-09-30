import { bulkCandidates, normalizeCardName, type BulkLine, type BulkMatch } from "@/application/bulk-cards";
import { loadCataloguePage } from "./catalogue-page-repository";
import type { CatalogueItem } from "@/domain/commerce";
export async function findBulkCards(lines: BulkLine[], signal: AbortSignal): Promise<BulkMatch[]> {
  const cache=new Map<string,CatalogueItem[]>();
  const matches: BulkMatch[]=[];
  for(const request of lines){
    if(request.error){matches.push({request,candidates:[]});continue;}
    const key=normalizeCardName(request.name);
    let cards=cache.get(key);
    if(!cards){
      cards=[];let offset:number|null=0;
      while(offset!==null){
        if(signal.aborted) throw new DOMException('Aborted','AbortError');
        const page=await loadCataloguePage({q:request.name,showOutOfStock:false},offset,signal);
        cards.push(...page.cards);offset=page.nextOffset;
      }
      cache.set(key,cards);
    }
    matches.push({request,candidates:bulkCandidates(request,cards)});
  }
  return matches;
}
