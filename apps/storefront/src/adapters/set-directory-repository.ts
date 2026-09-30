import type { SetPage } from "@/domain/set-directory";
import { demoMode } from "./commerce-repositories";

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = process.env.NEXT_PUBLIC_MEDUSA_URL;
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("The set directory is not configured.");
  const response = await fetch(`${url.replace(/\/$/, "")}${path}`, { headers: { "x-publishable-api-key": key }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load this list. Please try again.");
  return response.json() as Promise<T>;
}

// Demo previews use their own API route and never request Scryfall from the browser.
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!demoMode) return request<T>(path, signal);
  const response = await fetch(`/api/demo${path.replace("/store/tcg", "")}`, { signal });
  if (!response.ok) throw new Error("Unable to load the demo list.");
  return response.json() as Promise<T>;
}
export const setDirectoryRepository = {
  list: (options: { offset?: number; query?: string; limit: number; signal?: AbortSignal }) => {
    const query = new URLSearchParams({ limit: String(options.limit) });
    query.set("offset", String(options.offset ?? 0));
    if (options.query) query.set("q", options.query);
    return get<SetPage>(`/store/tcg/sets?${query}`, options.signal);
  },
  hottest: (signal?: AbortSignal) => get<{ variantIds: string[] }>("/store/tcg/hottest", signal),
};
