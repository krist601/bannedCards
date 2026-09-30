import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {redirect} from "next/navigation";
import {Shop} from '@/presentation/shop';
export default async function SealedPage({searchParams}:{searchParams:Promise<{language?:string}>}){if(!(await loadStorefrontSettings()).sealed)redirect("/");const params=await searchParams;return <Shop sealedView={{}} initialLanguage={params.language}/>;}
