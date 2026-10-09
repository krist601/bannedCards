"use client";
import type { CartLine } from "@/domain/commerce";
import { lineAvailability } from "@/application/cart";
import { CardImage } from "./card-image";
import { useLocale } from "./locale-provider";

type Props = { item: CartLine; availableStock: number | null; disabled: boolean; price(value: number): string; onQuantity(lineId: string, value: number): void };

/** One cart line. Lines that ran out of stock stay visible with an explanation and a Remove button. */
export function CartLineView({ item, availableStock, disabled, price, onQuantity }: Props) {
  const { t } = useLocale();
  const state = lineAvailability({ stock: availableStock, quantity: item.quantity });
  const atStockLimit = state === "ok" && availableStock !== null && item.quantity >= availableStock;
  const lineId = item.lineId ?? item.id;
  const details = [...(item.finish === "Standard" && item.condition === "See listing" ? [] : [t(item.finish), t(item.condition), ...(item.attributes?.language ? [item.attributes.language] : [])]), ...(atStockLimit ? [t("stock limit reached")] : [])].join(" · ");
  return <div className={`cart-line${state === "ok" ? "" : " cart-line-unavailable"}`} data-availability={state}>
    <div className={`cart-mini ${item.theme}`}><CardImage item={item} compact /></div>
    <div>
      <strong>{item.name}</strong>
      <small>{details}</small>
      <span>{state === "out" ? <del>{price(item.price)}</del> : price(item.price)}</span>
      {state === "out" && <p className="cart-line-notice" role="status">{t("You had this in your cart, but it is out of stock right now.")}</p>}
      {state === "short" && <p className="cart-line-notice" role="status">{t("Only")} {availableStock} {t("left in stock; you have")} {item.quantity} {t("in your cart.")} <button type="button" className="text-button" disabled={disabled} onClick={() => onQuantity(lineId, availableStock!)}>{t("Keep")} {availableStock}</button></p>}
    </div>
    {state === "out"
      ? <button type="button" className="cart-line-remove" disabled={disabled} aria-label={`${t("Remove")} ${item.name}`} onClick={() => onQuantity(lineId, 0)}>{t("Remove")}</button>
      : <div className="quantity">
          <button type="button" aria-label={`${t("Remove one")} ${item.name}`} disabled={disabled} onClick={() => onQuantity(lineId, item.quantity - 1)}>−</button>
          <b>{item.quantity}</b>
          <button type="button" aria-label={atStockLimit || state === "short" ? `No more ${item.name} in stock` : `Add one more ${item.name}`} title={atStockLimit || state === "short" ? "No more copies in stock" : "Add one more"} disabled={disabled || atStockLimit || state === "short"} onClick={() => onQuantity(lineId, item.quantity + 1)}>+</button>
        </div>}
  </div>;
}
