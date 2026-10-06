import type { CatalogueItem } from '../domain/commerce';
import { mapItem } from './medusa-repositories';
import { sealedSlug } from '../application/sealed-catalogue';
type Category={id:string;handle:string;name:string;parent_category_id?:string|null};
type Base=Parameters<typeof mapItem>[0];
type Product=Omit<Base,'variants'> & {created_at?:string;categories?:Category[];variants?:(NonNullable<Base['variants']>[number]&{options?:{value:string;option?:{title:string}}[];calculated_price?:{currency_code:string;calculated_amount:number|null;original_amount?:number|null}})[]};
/** Server-side projection: sales-channel-scoped Medusa prices and inventory remain authoritative. */
export async function loadSealedDirectory(signal?:AbortSignal):Promise<CatalogueItem[]> {
  if(process.env.NEXT_PUBLIC_COMMERCE_MODE==='demo')return [];
  async function request<T>(path:string):Promise<T>{
    const timeout=AbortSignal.timeout(30000);
    const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}${path}`,{headers:{'x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},cache:'no-store',signal:signal?AbortSignal.any([signal,timeout]):timeout});
    if(!response.ok)throw new Error('Unable to load sealed products. Please retry.');
    return response.json();
  }
  const categories:Category[]=[];
  for(let offset=0;;offset+=100){
    const page=await request<{product_categories:Category[];count:number}>(`/store/product-categories?limit=100&offset=${offset}`);
    categories.push(...page.product_categories);if(!page.product_categories.length||offset+100>=page.count)break;
  }
  const root=categories.find(c=>c.handle==='sealed-products');if(!root)return [];
  function ancestry(category:Category){const result:Category[]=[];const visited=new Set<string>();let node:Category|undefined=category;while(node&&!visited.has(node.id)){result.push(node);visited.add(node.id);node=categories.find(c=>c.id===node?.parent_category_id);}return result;}
  const descendants=categories.filter(c=>ancestry(c).some(parent=>parent.id===root.id));
  const products:Product[]=[];
  for(let offset=0;;offset+=100){
    const params=new URLSearchParams({limit:'100',offset:String(offset),region_id:process.env.NEXT_PUBLIC_MEDUSA_REGION_ID??'',order:'-created_at',fields:'+metadata,+created_at,*categories,+variants.metadata,*variants.options.option,*variants.calculated_price,+variants.inventory_quantity'});
    descendants.forEach((c,i)=>params.set(`category_id[${i}]`,c.id));
    const page=await request<{products:Product[];count:number}>(`/store/products?${params}`);
    products.push(...page.products);if(!page.products.length||offset+100>=page.count)break;
  }
  // Imported products may lack release metadata. Resolve their set's release
  // from the synced catalogue, never from the product's creation timestamp.
  const releaseDates=new Map<string,string>();
  const codes=[...new Set(products.map(p=>String(p.metadata?.set_code??'').trim().toLowerCase()).filter(Boolean))];
  await Promise.all(codes.map(async code=>{
    for(let offset=0;;){
      const page=await request<{sets:{code:string;setCodes:string[];releasedAt:string|null}[];nextOffset:number|null}>(`/store/tcg/sets?limit=10&offset=${offset}&q=${encodeURIComponent(code)}`);
      const set=page.sets.find(s=>s.code.toLowerCase()===code||s.setCodes.some(c=>c.toLowerCase()===code));
      if(set?.releasedAt){releaseDates.set(code,set.releasedAt);break;}
      if(page.nextOffset===null||page.nextOffset<=offset)break;
      offset=page.nextOffset;
    }
  }));
  return [...new Map(products.map(p=>[p.id,p])).values()].flatMap(product=>(product.variants??[]).map(variant=>{
    const item=mapItem(product,variant,variant.calculated_price?.calculated_amount??0);
    const metadata={...product.metadata,...variant.metadata};
    const str=(key:string)=>typeof metadata[key]==='string'?metadata[key] as string:'';
    const language=str('language')||variant.options?.find(o=>o.option?.title.toLowerCase()==='language')?.value||'Unspecified';
    const paths=(product.categories??[]).flatMap(c=>ancestry(categories.find(known=>known.id===c.id)??c)).map(c=>c.handle.replace(/^sealed-/,''));
    const amount=variant.calculated_price;
    return {...item,kind:'sealed' as const,name:product.title,finish:'Sealed',condition:'Factory sealed',price:amount?.currency_code?.toLowerCase()==='clp'?amount.calculated_amount:null,
      attributes:{productId:product.id,demoInventory:metadata.demo_inventory===true?"true":"false",language,categoryPaths:[...new Set(paths)].join(','),setSlug:sealedSlug(item.setCode||item.set),addedAt:product.created_at??'',originalPrice:String(amount?.original_amount??''),bannerImage:str('banner_image'),productCutout:str('product_cutout')||item.imageUrl||'',bannerColor:/^#[0-9a-f]{6}$/i.test(str('banner_color'))?str('banner_color'):'',releasedAt:releaseDates.get(String(product.metadata?.set_code??'').trim().toLowerCase())||str('set_released_at')}};
  }));
}
