import { redirect } from "next/navigation";
import { loadStorefrontSettings } from "@/adapters/storefront-settings";
import { Shop } from "@/presentation/shop";
export default async function SinglesPage() { if (!(await loadStorefrontSettings()).singles) redirect("/"); return <Shop singles />; }
