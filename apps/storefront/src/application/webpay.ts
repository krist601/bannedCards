/** Webpay helpers that need no browser or network. */

/** Only Transbank's own Webpay addresses are accepted as the place to send the shopper to pay. */
export const isWebpayUrl = (value: string) => /^https:\/\/webpay3g(int)?\.transbank\.cl\//.test(value);

export const webpayReturnKeys = ["token_ws", "TBK_TOKEN", "TBK_ORDEN_COMPRA", "TBK_ID_SESION"] as const;
export type WebpayReturnParams = Partial<Record<(typeof webpayReturnKeys)[number], string>>;

/** The values Transbank put in the return address, and nothing else. */
export function readWebpayReturn(search: string | URLSearchParams): WebpayReturnParams {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const result: WebpayReturnParams = {};
  for (const key of webpayReturnKeys) { const value = params.get(key); if (value) result[key] = value.slice(0, 200); }
  return result;
}
export const hasWebpayReturn = (params: WebpayReturnParams) => Boolean(params.token_ws || params.TBK_TOKEN || params.TBK_ORDEN_COMPRA);
