import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {redirect} from "next/navigation";
import {Shop} from '@/presentation/shop';
export default async function Page(){if(!(await loadStorefrontSettings()).custom)redirect("/");return <Shop shopSection="custom"/>;}
