import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {notFound} from "next/navigation";
import {Shop} from '@/presentation/shop';
export default async function SellCardsPage(){if(!(await loadStorefrontSettings()).buyCards)notFound();return <Shop buyCards/>;}
