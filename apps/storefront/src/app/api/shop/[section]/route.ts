import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {NextRequest,NextResponse} from 'next/server';
import {loadShopSectionDirectoryCached} from '@/adapters/shop-section-directory';
import {isShopSection} from '@/config/shop-sections';

export async function GET(request:NextRequest,{params}:{params:Promise<{section:string}>}){
 const NS={'Cache-Control':'no-store'};
 const {section}=await params;
 if(!isShopSection(section))return NextResponse.json({message:'Unknown section'},{status:404,headers:NS});
 const p=request.nextUrl.searchParams;
 const offset=Number(p.get('offset')??0);const limit=Math.min(Math.max(Number(p.get('limit')??24),1),50);
 if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit))return NextResponse.json({message:'Invalid paging'},{status:400,headers:NS});
 try{
  if(!(await loadStorefrontSettings())[section])return NextResponse.json({message:'This section is disabled'},{status:404,headers:NS});
  const {items,categories}=await loadShopSectionDirectoryCached(section);
  const q=(p.get('q')??'').trim().toLowerCase();const category=p.get('category')||'';
  const matching=items.filter(item=>(!q||item.name.toLowerCase().includes(q))&&(!category||(item.attributes?.categoryPaths??'').split(',').includes(category)));
  return NextResponse.json({items:matching.slice(offset,offset+limit),count:matching.length,nextOffset:offset+limit<matching.length?offset+limit:null,
   categories:categories.map(c=>({...c,count:items.filter(item=>(item.attributes?.categoryPaths??'').split(',').includes(c.handle)).length}))},
   {headers:{'Cache-Control':'public, max-age=30, stale-while-revalidate=60'}});
 }catch{return NextResponse.json({message:'Unable to load products. Please retry.'},{status:502,headers:NS});}
}
