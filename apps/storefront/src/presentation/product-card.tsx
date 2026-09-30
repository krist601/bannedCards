"use client";
import {useLocale} from "./locale-provider";
import { useId, useState } from "react";
import type { Cart, CatalogueItem } from "@/domain/commerce";
import { conditionCode, type CardGroup } from "@/application/group-cards";
import { CardImage } from "./card-image";
import { CardWear } from "./card-wear";
const languages: Record<string, [string, string]> = {
  en: ["🇬🇧", "English"], es: ["🇪🇸", "Spanish"], fr: ["🇫🇷", "French"], de: ["🇩🇪", "German"], it: ["🇮🇹", "Italian"], pt: ["🇵🇹", "Portuguese"], ja: ["🇯🇵", "Japanese"], ko: ["🇰🇷", "Korean"], ru: ["🇷🇺", "Russian"], zhs: ["🇨🇳", "Simplified Chinese"], zht: ["🇹🇼", "Traditional Chinese"]
};
function finishLabel(finish: string) {
  const key = finish.toLowerCase().replace(/[ _-]/g, "");
  return ["normal", "nonfoil", "standard"].includes(key) ? "Normal" : key === "foil" ? "Foil" : finish;
}
function defaultCard(cards: CatalogueItem[]) {
  return cards.find(item => finishLabel(item.finish) === "Normal" && item.stock !== 0)
    ?? cards.find(item => finishLabel(item.finish) === "Foil" && item.stock !== 0)
    ?? cards.find(item => finishLabel(item.finish) === "Normal") ?? cards[0];
}
const conditions = ["NM", "LP", "MP", "HP", "DMG"];
const price = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
export function ProductCard({ group, cart, disabled, onAdd }: { group: CardGroup; cart: Cart; disabled: boolean; onAdd(card: CatalogueItem): void }) {
 const {t}=useLocale();
  const [selected, setSelected] = useState(() => defaultCard(group.cards).id);
  const card = group.cards.find(item => item.id === selected) ?? defaultCard(group.cards);
  const panel = useId();
  const inCart = cart.find(line => line.id === card.id)?.quantity ?? 0;
  const unlisted = conditionCode(card.condition) === "NOT LISTED";
  const activeCondition = unlisted ? "NM" : conditionCode(card.condition);
  const soldOut = unlisted || card.stock === 0;
  const atLimit = card.stock !== null && inCart >= card.stock;
  const code = card.attributes?.language?.toLowerCase();
  const language = code ? languages[code] ?? Object.values(languages).find(([, name]) => name.toLowerCase() === code) : undefined;
  const finishes = [...new Set(["Normal", "Foil", ...group.cards.map(item => finishLabel(item.finish))])];
  const availableFinishes = finishes.filter(finish => group.cards.some(item => finishLabel(item.finish) === finish));
  const finishCards = group.cards.filter(item => finishLabel(item.finish) === finishLabel(card.finish));
  const tabs = [...new Set([...conditions, ...finishCards.map(item => conditionCode(item.condition)).filter(code => code !== "NOT LISTED" && !conditions.includes(code))])];
  function selectFinish(finish: string) {
    const choices = group.cards.filter(item => finishLabel(item.finish) === finish);
    setSelected((choices.find(item => conditionCode(item.condition) === conditionCode(card.condition)) ?? choices.find(item => item.stock !== 0) ?? choices[0]).id);
  }
  return <article className={`product${soldOut ? " is-out-of-stock" : ""}`}>
    <div className="finish-tabs condition-tabs" role="tablist" aria-label={`${card.name} finish`}>
      {finishes.map((finish, index) => <button key={finish} id={`${panel}-finish-${index}`} type="button" role="tab" aria-selected={finish === finishLabel(card.finish)} aria-controls={`${panel}-finish-panel`} disabled={!availableFinishes.includes(finish)} tabIndex={finish === finishLabel(card.finish) ? 0 : -1} onClick={() => selectFinish(finish)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const current = availableFinishes.indexOf(finish);
        const next = event.key === "Home" ? 0 : event.key === "End" ? availableFinishes.length - 1 : (current + (event.key === "ArrowRight" ? 1 : availableFinishes.length - 1)) % availableFinishes.length;
        selectFinish(availableFinishes[next]); document.getElementById(`${panel}-finish-${finishes.indexOf(availableFinishes[next])}`)?.focus();
      }}>{finish}</button>)}
    </div>
    <div role="tabpanel" id={`${panel}-finish-panel`} aria-labelledby={`${panel}-finish-${finishes.indexOf(finishLabel(card.finish))}`}>
    <div className={`card-art ${card.theme}`}><CardImage key={card.imageUrl} item={card} /><CardWear condition={activeCondition} /></div>
    <div className="product-details">
      <p className="set">{card.set}</p><h3 className="card-name"><span className="language-flag" role="img" aria-label={language?.[1] ?? code ?? "Language unspecified"} title={language?.[1] ?? code ?? "Language unspecified"}>{language?.[0] ?? code?.toUpperCase() ?? "—"}</span><span>{card.name}</span></h3>
      <div className="condition-tabs" role="tablist" aria-label={`${card.name} condition`}>
        {tabs.map(code => {
          const item = finishCards.find(item => conditionCode(item.condition) === code);
          return <button key={code} id={`${panel}-${code}`} type="button" role="tab" aria-selected={code === activeCondition} aria-controls={panel} tabIndex={item?.id === card.id ? 0 : -1} disabled={!item || unlisted} title={item?.condition ?? `${code} unavailable`} onClick={() => item && setSelected(item.id)} onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const available = tabs.filter(value => finishCards.some(item => conditionCode(item.condition) === value));
            const index = available.indexOf(code);
            const next = event.key === "Home" ? available[0] : event.key === "End" ? available.at(-1)! : available[(index + (event.key === "ArrowRight" ? 1 : available.length - 1)) % available.length];
            setSelected(finishCards.find(item => conditionCode(item.condition) === next)!.id);
            document.getElementById(`${panel}-${next}`)?.focus();
          }}>{code}</button>;
        })}
      </div>
      <div className="condition-panel" role="tabpanel" id={panel} aria-labelledby={`${panel}-${activeCondition}`}>
        <div className="product-footer"><strong>{card.price === null ? t("Price unavailable") : price(card.price)}</strong><button type="button" disabled={disabled || soldOut || atLimit} onClick={() => onAdd(card)}>{soldOut ? t("Out of stock") : atLimit ? t("All in cart") : inCart > 0 ? t("Add another") : t("Add")}</button></div>
        <small>{unlisted ? t("Out of stock") : card.stock === null ? t("Available to order") : `${card.stock} ${t("in stock")}`}{inCart > 0 ? ` · ${inCart} ${t("in cart")}` : ""}{atLimit && !soldOut ? ` · ${t("stock limit reached")}` : ""}</small>
      </div>
    </div>
    </div>
  </article>;
}
