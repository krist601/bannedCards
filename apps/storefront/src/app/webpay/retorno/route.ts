import type { NextRequest } from "next/server";
import { readWebpayReturn, webpayReturnKeys } from "@/application/webpay";

/**
 * Transbank sends the shopper back here after the Webpay form (by GET or by POST, depending on the flow).
 * Nothing is decided here: the values are passed on to the result page, which asks the store to confirm the payment.
 */
function toResultPage(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const key of webpayReturnKeys) if (values[key]) params.set(key, String(values[key]));
  // A relative address keeps the shopper on the public domain (the app itself runs behind a proxy).
  return new Response(null, { status: 303, headers: { Location: `/webpay/resultado${params.size ? `?${params}` : ""}`, "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) { return toResultPage(readWebpayReturn(request.nextUrl.searchParams)); }
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const values: Record<string, string | undefined> = {};
  for (const key of webpayReturnKeys) { const value = form?.get(key); if (typeof value === "string") values[key] = value.slice(0, 200); }
  return toResultPage(values);
}
