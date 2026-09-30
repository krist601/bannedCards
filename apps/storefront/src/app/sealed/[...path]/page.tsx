import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {redirect} from "next/navigation";
import {notFound} from 'next/navigation';
import {Shop} from '@/presentation/shop';
import {sealedCategories,sealedCollections} from '@/config/sealed';
export default async function SealedPage({params,searchParams}:{params:Promise<{path:string[]}>;searchParams:Promise<{language?:string}>}){
  if(!(await loadStorefrontSettings()).sealed)redirect("/");
  const {path}=await params;const {language}=await searchParams;
  const view=path.length===1&&sealedCategories.some(c=>c.slug===path[0])?{category:path[0]}:
    path.length===2&&path[0]==='sets'?{set:path[1]}:
    path.length===2&&path[0]==='collections'&&path[1] in sealedCollections?{collection:path[1]}:null;
  if(!view)notFound();return <Shop sealedView={view} initialLanguage={language}/>;
}
