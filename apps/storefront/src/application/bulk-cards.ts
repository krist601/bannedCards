import type { Cart, CatalogueItem } from "@/domain/commerce";
export type BulkLine = { line: number; name: string; quantity: number; foil: boolean; setCode?: string; error?: string; note?: string };
export type BulkMatch = { request: BulkLine; candidates: CatalogueItem[]; selectedId?: string };
export type BulkAllocation = { card: CatalogueItem; quantity: number };
export const normalizeCardName = (name: string) => name.normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
export function parseBulkList(text: string): BulkLine[] {
  return text.split(/\r?\n/).map((raw,index)=>({raw:raw.trim(),line:index+1})).filter(row=>row.raw).map(({raw,line})=>{
    const match=raw.match(/^(\d+)\s*x?\s+(.+)$/i);
    if(!match) return {line,name:raw,quantity:0,foil:false,error:'Use a quantity followed by a card name.'};
    const quantity=Number(match[1]); let name=match[2].trim(); let foil=false; let setCode: string|undefined;
    // Accept either “Name F (SET)” or “Name (SET) F”.
    for(let index=0;index<2;index++) {
      if(/\s+F$/i.test(name)){foil=true;name=name.replace(/\s+F$/i,'').trim();}
      const set=name.match(/\s*\(([a-z0-9]{2,10})\)$/i);
      if(set){setCode=set[1].toLowerCase();name=name.slice(0,set.index).trim();}
    }
    const alias=setCode==='lor'||setCode==='tlr';
    if(alias) setCode='ltr';
    return {line,name,quantity,foil,setCode,...(alias?{note:'Using LTR (The Lord of the Rings) for your set code.'}:{}),...(!name||!Number.isSafeInteger(quantity)||quantity<1||quantity>999?{error:'Use a card name and quantity from 1 to 999.'}:{})};
  });
}
export function bulkCandidates(request: BulkLine, cards: CatalogueItem[]) {
  return cards.filter(card=>normalizeCardName(card.name)===normalizeCardName(request.name)
    && (!request.setCode || card.setCode?.toLowerCase()===request.setCode)
    && (request.foil ? card.finish.toLowerCase()==='foil' : ['non-foil','non foil','normal','standard'].includes(card.finish.toLowerCase()))
    && card.stock!==0 && card.price!==null)
    .sort((a,b)=>a.price!-b.price! || a.id.localeCompare(b.id));
}
export function planBulk(matches: BulkMatch[], cart: Cart) {
  const reserved=new Map(cart.map(item=>[item.id,item.quantity]));
  return matches.map(match=>{
    let remaining=match.request.error?0:match.request.quantity;
    const allocations: BulkAllocation[]=[];
    for(const card of match.candidates){
      if(match.selectedId && match.selectedId!==card.id) continue;
      const quantity=Math.min(remaining,Math.max(0,(card.stock??Infinity)-(reserved.get(card.id)??0)));
      if(quantity>0){allocations.push({card,quantity});reserved.set(card.id,(reserved.get(card.id)??0)+quantity);remaining-=quantity;}
      if(!remaining) break;
    }
    return {...match,allocations,missing:remaining};
  });
}
