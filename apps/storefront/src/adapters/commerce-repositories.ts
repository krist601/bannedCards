import type { CommerceRepositories } from "@/application/ports";
import { browserCartRepository, browserCustomerSession } from "./browser-repositories";
import { demoCatalogueRepository } from "./demo-catalogue-repository";
import { createMedusaRepositories } from "./medusa-repositories";

export const demoMode = process.env.NEXT_PUBLIC_COMMERCE_MODE === "demo";
export function createCommerceRepositories(): CommerceRepositories {
  if (demoMode) return { catalogue: demoCatalogueRepository, cart: browserCartRepository, customer: browserCustomerSession };
  const url = process.env.NEXT_PUBLIC_MEDUSA_URL;
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID;
  if (!url || !publishableKey || !regionId) throw new Error("Configure the Medusa URL, publishable key and CLP region, or explicitly select demo mode.");
  return createMedusaRepositories({ url, publishableKey, regionId }, window.localStorage);
}
