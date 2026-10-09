import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {NextRequest,NextResponse} from 'next/server';
import {unstable_cache} from 'next/cache';
import {loadShopSectionDirectory} from '@/adapters/shop-section-directory';
import {isShopSection,type ShopSectionKey} from '@/config/shop-sections';

const directories:Record<ShopSectionKey,()=>ReturnType<typeof loadShopSectionDirectory>>={
 custom:unstable_cache(()=>loadShopSectionDirectory('custom'),['shop-section','custom'],{revalidate:60}),
 accessories:unstable_cache(()=>loadShopSectionDirectory('accessories'),['shop-section','accessories'],{revalidate:60}),
};

export async function GET(request:NextRequest,{params}:{params:Promise<{section:string}>}){
 const {section}=await params;
 if(!isShopSection(section))return NextResponse.json({message:'Unknown section'},{status:404});
 const p=request.nextUrl.searchParams;
 const offset=Number(p.get('offset')??0);const limit=Math.min(Math.max(Number(p.get('limit')??24),1),50);
 if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit))return NextResponse.json({message:'Invalid paging'},{status:400});
 try{
  if(!(await loadStorefrontSettings())[section])return NextResponse.json({message:'This section is disabled'},{status:404});
  const {items,categories}=await directories[section]();
  const q=(p.get('q')??'').trim().toLowerCase();const category=p.get('category')||'';
  const matching=items.filter(item=>(!q||item.name.toLowerCase().includes(q))&&(!category||(item.attributes?.categoryPaths??'').split(',').includes(category)));
  return NextResponse.json({items:matching.slice(offset,offset+limit),count:matching.length,nextOffset:offset+limit<matching.length?offset+limit:null,
   categories:categories.map(c=>({...c,count:items.filter(item=>(item.attributes?.categoryPaths??'').split(',').includes(c.handle)).length}))});
 }catch{return NextResponse.json({message:'Unable to load products. Please retry.'},{status:502});}
}
