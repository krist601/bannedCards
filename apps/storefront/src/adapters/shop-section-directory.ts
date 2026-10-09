import type {CatalogueItem} from '../domain/commerce';
import {mapItem} from './medusa-repositories';
import {shopSections,type ShopSectionKey} from '../config/shop-sections';
type Category={id:string;handle:string;name:string;parent_category_id?:string|null};
type Base=Parameters<typeof mapItem>[0];
type Product=Omit<Base,'variants'> & {created_at?:string;categories?:Category[];variants?:(NonNullable<Base['variants']>[number]&{title?:string;calculated_price?:{currency_code:string;calculated_amount:number|null;original_amount?:number|null}})[]};
export type ShopSectionDirectory={items:CatalogueItem[];categories:{handle:string;name:string}[]};
/** Server-side projection of one product section: sales-channel-scoped Medusa prices and inventory stay authoritative. */
export async function loadShopSectionDirectory(key:ShopSectionKey,signal?:AbortSignal):Promise<ShopSectionDirectory>{
 const section=shopSections[key];
 if(process.env.NEXT_PUBLIC_COMMERCE_MODE==='demo')return {items:[],categories:[]};
 async function request<T>(path:string):Promise<T>{
  const timeout=AbortSignal.timeout(30000);
  const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}${path}`,{headers:{'x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},cache:'no-store',signal:signal?AbortSignal.any([signal,timeout]):timeout});
  if(!response.ok)throw new Error('Unable to load products. Please retry.');
  return response.json();
 }
 const categories:Category[]=[];
 for(let offset=0;;offset+=100){
  const page=await request<{product_categories:Category[];count:number}>(`/store/product-categories?limit=100&offset=${offset}`);
  categories.push(...page.product_categories);if(!page.product_categories.length||offset+100>=page.count)break;
 }
 const root=categories.find(c=>c.handle===section.root);if(!root)return {items:[],categories:[]};
 const children=categories.filter(c=>c.parent_category_id===root.id);
 const inTree=new Set([root.id,...children.map(c=>c.id)]);
 const products:Product[]=[];
 for(let offset=0;;offset+=100){
  const params=new URLSearchParams({limit:'100',offset:String(offset),region_id:process.env.NEXT_PUBLIC_MEDUSA_REGION_ID??'',order:'-created_at',fields:'+metadata,+created_at,*categories,+variants.metadata,*variants.calculated_price,+variants.inventory_quantity'});
  [...inTree].forEach((id,i)=>params.set(`category_id[${i}]`,id));
  const page=await request<{products:Product[];count:number}>(`/store/products?${params}`);
  products.push(...page.products);if(!page.products.length||offset+100>=page.count)break;
 }
 const items=[...new Map(products.map(p=>[p.id,p])).values()].flatMap(product=>(product.variants??[]).map(variant=>{
  const item=mapItem(product,variant,variant.calculated_price?.calculated_amount??0);
  const amount=variant.calculated_price;
  const handles=(product.categories??[]).map(c=>c.handle).filter(h=>h!==section.root);
  return {...item,kind:section.kind,name:product.title,set:'',finish:section.title,condition:'New',price:amount?.currency_code?.toLowerCase()==='clp'?amount.calculated_amount:null,
   attributes:{productId:product.id,categoryPaths:handles.join(','),addedAt:product.created_at??'',originalPrice:String(amount?.original_amount??'')}};
 }));
 return {items,categories:children.map(c=>({handle:c.handle,name:c.name}))};
}

const FRESH_MS=60_000,STALE_MS=600_000;
type Entry={value?:ShopSectionDirectory;at:number;flight?:Promise<ShopSectionDirectory>};
const cache=new Map<ShopSectionKey,Entry>();
/** In-process stale-while-revalidate: fresh 60 s, then served stale up to 10 min while one background refresh runs. Errors are never cached. */
export function loadShopSectionDirectoryCached(key:ShopSectionKey):Promise<ShopSectionDirectory>{
 const entry=cache.get(key)??{at:0};cache.set(key,entry);
 const age=Date.now()-entry.at;
 const refresh=()=>entry.flight??(entry.flight=loadShopSectionDirectory(key).then(value=>{entry.value=value;entry.at=Date.now();return value;}).finally(()=>{entry.flight=undefined;}));
 if(entry.value&&age<FRESH_MS)return Promise.resolve(entry.value);
 if(entry.value&&age<STALE_MS){refresh().catch(()=>undefined);return Promise.resolve(entry.value);}
 return refresh();
}
