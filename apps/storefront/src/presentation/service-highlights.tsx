"use client";
import Link from "next/link";
import { useSections } from "./sections-provider";
import { useLocale } from "./locale-provider";

const icon = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const SellIcon = () => <svg {...icon}><rect x="7" y="3" width="11" height="15" rx="2" /><path d="M4 7v12a2 2 0 0 0 2 2h9" /><circle cx="12.5" cy="10.5" r="2.4" /><path d="M12.5 9.4v2.2" /></svg>;
const ListIcon = () => <svg {...icon}><path d="M4 6h9M4 11h6M4 16h5" /><circle cx="16" cy="14" r="4" /><path d="M19 17l2.5 2.5" /></svg>;
const HeartIcon = () => <svg {...icon} width={38} height={38}><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z" /></svg>;

/** Calls to action shown above the footer: sell your cards, paste a deck list, and the family story. */
export function ServiceHighlights({ onOpenBulk }: { onOpenBulk(): void }) {
  const { t } = useLocale();
  const sections = useSections();
  const cards = [sections.buyCards, sections.bulkFinder].filter(Boolean).length;
  if (!cards && !sections.family) return null;
  return <section className="services" aria-label={t("About our store")}>
    {cards > 0 && <div className={`service-cards service-cards-${cards}`}>
      {sections.buyCards && <article className="service-card">
        <span className="service-icon"><SellIcon /></span>
        <p className="service-eyebrow">{t("Sell to us")}</p>
        <h2>{t("We buy your cards")}</h2>
        <p>{t("Give the cards you no longer play a new home. Find out how we value your collection and check our buying rates.")}</p>
        <Link className="service-cta service-cta-solid" href="/sell-cards">{t("See our buying rates →")}</Link>
      </article>}
      {sections.bulkFinder && <article className="service-card">
        <span className="service-icon"><ListIcon /></span>
        <p className="service-eyebrow">{t("Build your deck")}</p>
        <h2>{t("Find your whole list")}</h2>
        <p>{t("Building a deck? Paste your card list, check our available stock, and add your matches to the cart.")}</p>
        <button className="service-cta service-cta-outline" type="button" aria-haspopup="dialog" onClick={onOpenBulk}>{t("Open bulk finder →")}</button>
      </article>}
    </div>}
    {sections.family && <aside className="family-band">
      <span className="family-icon"><HeartIcon /></span>
      <div>
        <p className="service-eyebrow">{t("Our story")}</p>
        <h2>{t("A small family business")}</h2>
        <p>{t("We’re a small, family-run business in Chile. Thank you for supporting our shop and sharing your love of cards with us.")}</p>
      </div>
    </aside>}
  </section>;
}
