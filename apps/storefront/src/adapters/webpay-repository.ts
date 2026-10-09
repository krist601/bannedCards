import type { WebpayOutcome } from "@/domain/commerce";
import type { WebpayReturnParams } from "@/application/webpay";

/** Asks the store what happened to a payment the shopper just finished (or cancelled) at Webpay. No sign-in is needed. */
export async function fetchWebpayOutcome(params: WebpayReturnParams, signal?: AbortSignal): Promise<WebpayOutcome> {
  const base = (process.env.NEXT_PUBLIC_MEDUSA_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${base}/store/webpay/result`, {
    method: "POST", cache: "no-store", signal: signal ?? AbortSignal.timeout(45000),
    headers: { "Content-Type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "" },
    body: JSON.stringify(params),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(body.message ?? "We could not confirm the payment."));
  return body as WebpayOutcome;
}
