import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import { NextRequest,NextResponse } from 'next/server';
import { loadSealedDirectory } from '@/adapters/sealed-directory';
import { selectSealed } from '@/application/sealed-catalogue';
export async function GET(request:NextRequest){
  const p=request.nextUrl.searchParams;
  const offset=Number(p.get('offset')??0);
  if(!Number.isInteger(offset)||offset<0)return NextResponse.json({message:'Invalid offset'},{status:400});
  try{
    if(!(await loadStorefrontSettings()).sealed)return NextResponse.json({message:"Sealed products are disabled"},{status:404});
    const all=await loadSealedDirectory(request.signal);
    const query={q:p.get('q')||undefined,category:p.get('category')||undefined,set:p.get('set')||undefined,language:p.get('language')||undefined,collection:p.get('collection')||undefined};
    const selected=selectSealed(all,query);
    const scope=selectSealed(all,{...query,language:undefined});
    const sets=[...new Map(all.filter(i=>i.attributes?.setSlug).map(i=>[i.attributes!.setSlug,{slug:i.attributes!.setSlug,name:i.set,image:i.attributes!.productCutout,background:i.attributes!.bannerImage,color:i.attributes!.bannerColor,releasedAt:i.attributes!.releasedAt}])).values()].sort((a,b)=>b.releasedAt.localeCompare(a.releasedAt));
    const setGroups=sets.map(set=>{
      const members=all.filter(item=>item.attributes?.setSlug===set.slug);
      const picked=new Map<string,{src:string;name:string}>();
      const add=(item:typeof members[number]|undefined)=>{const src=item?.attributes?.productCutout||item?.imageUrl;if(src&&item&&!picked.has(src))picked.set(src,{src,name:item.name});};
      for(const category of ['booster-boxes','bundles','precons','booster-packs','extras'])add(members.find(item=>(item.attributes?.categoryPaths??'').split(',').includes(category)));
      for(const item of members)add(item);
      return {...set,images:[...picked.values()].slice(0,5)};
    });
    const banners=all.map(i=>({categories:(i.attributes?.categoryPaths??'').split(','),image:i.attributes?.productCutout,background:i.attributes?.bannerImage,color:i.attributes?.bannerColor,set:i.set,release:i.attributes?.releasedAt??'',added:i.attributes?.addedAt??''})).sort((a,b)=>b.release.localeCompare(a.release)||b.added.localeCompare(a.added));
    return NextResponse.json({items:selected.slice(offset,offset+24),count:selected.length,nextOffset:offset+24<selected.length?offset+24:null,languages:[...new Set(scope.map(i=>i.attributes?.language??'Unspecified'))].sort(),sets:setGroups,banners,
      rows:offset===0?Object.fromEntries(['newest','latest-releases','almost-gone','deals'].map(collection=>[collection,selectSealed(all,{...query,collection}).slice(0,10)])):undefined});
  }catch{return NextResponse.json({message:'Unable to load sealed products. Please retry.'},{status:502});}
}
