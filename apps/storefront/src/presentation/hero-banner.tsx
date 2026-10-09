"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogueItem } from "@/domain/commerce";
import { shopSections } from "@/config/shop-sections";
import { pagePaths, joinNames, shippingProviders } from "@/config/site";
import { useLocale } from "./locale-provider";

type Tile = { name: string; price: number | null; image?: string; note?: string };
type Key = "singles" | "sealed" | "custom" | "accessories";
type Props = {
  home: boolean;
  enabled: Record<Key, boolean> & { bulk: boolean };
  featuredCards: CatalogueItem[];
  cardCount?: number | null;
  onOpenBulk(): void;
  onFilter?(kind: "added" | "latest" | "all"): void;
};

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
const ROTATE_MS = 7000;

const text = {
  es: {
    prev: "Banner anterior", next: "Banner siguiente", label: "Destacados de la tienda",
    names: { singles: "Cartas sueltas", sealed: "Sellados", custom: "Productos personalizados", accessories: "Accesorios" },
    singles: { eyebrow: "Magic: The Gathering · Chile", title: ["Encuentra la próxima carta", "para tu mazo."], copy: "Cartas sueltas con la condición, el idioma y el acabado indicados. Lo que ves es exactamente lo que recibes.", cta: "Ver cartas sueltas", secondary: "Buscar mi lista" },
    sealed: { eyebrow: "Abre algo nuevo", title: ["Tu próxima apertura", "comienza aquí."], copy: "Sobres, cajas, bundles, mazos preconstruidos y lanzamientos especiales.", cta: "Ver productos sellados" },
    custom: { eyebrow: "Hecho por nosotros", title: ["Hecho en casa,", "hecho para tu mesa."], copy: "Mazos personalizados y packs de tokens diseñados por nuestro equipo.", cta: "Ver productos personalizados" },
    accessories: { eyebrow: "Juega con estilo", title: ["Todo para", "tu mesa."], copy: "Fundas, dados, playmats y más accesorios para tus partidas.", cta: "Ver accesorios" },
    chips: { added: "Recién agregadas", latest: "Últimos lanzamientos", all: "Todo el catálogo" },
    trust: ["Stock real", "Condición indicada en cada carta", "Despacho a todo Chile"],
    page: { eyebrow: "Catálogo de cartas sueltas", title: "Cartas sueltas de Magic", found: (n: number) => `${n.toLocaleString("es-CL")} cartas en el catálogo`, copy: "Filtra por edición, busca por nombre o pega tu lista completa.", bulk: "Buscar mi lista" },
    from: "Desde",
  },
  en: {
    prev: "Previous banner", next: "Next banner", label: "Store highlights",
    names: { singles: "Singles", sealed: "Sealed", custom: "Custom products", accessories: "Accessories" },
    singles: { eyebrow: "Magic: The Gathering · Chile", title: ["Find the next card", "for your deck."], copy: "Singles with condition, language and finish shown. What you see is exactly what you get.", cta: "Browse singles", secondary: "Find my list" },
    sealed: { eyebrow: "Open something new", title: ["Your next opening", "starts here."], copy: "Booster packs, boxes, bundles, preconstructed decks and special releases.", cta: "Browse sealed products" },
    custom: { eyebrow: "Made by us", title: ["Made in-house,", "made for your table."], copy: "Custom decks and token packs designed by our team.", cta: "Browse custom products" },
    accessories: { eyebrow: "Play in style", title: ["Everything for", "your table."], copy: "Sleeves, dice, playmats and more accessories for your games.", cta: "Browse accessories" },
    chips: { added: "Newly added", latest: "Latest releases", all: "Full catalogue" },
    trust: ["Real stock", "Condition shown on every card", "Delivery across Chile"],
    page: { eyebrow: "Singles catalogue", title: "Magic singles", found: (n: number) => `${n.toLocaleString("en-US")} cards in the catalogue`, copy: "Filter by set, search by name or paste your whole list.", bulk: "Find my list" },
    from: "From",
  },
} as const;

function Visual({ tiles, priority, max = 3 }: { tiles: Tile[]; priority?: boolean; max?: number }) {
  const { t } = useLocale();
  const shown = tiles.filter(tile => tile.image).slice(0, max);
  if (!shown.length) return <div className="hb-visual hb-visual-empty" aria-hidden="true"><span>B</span><span>C</span></div>;
  return <div className={`hb-visual hb-visual-${shown.length}`}>
    {shown.map((tile, index) => <figure className={`hb-tile hb-tile-${index}`} key={tile.name + index}>
      <img src={tile.image} alt={tile.name} loading={priority ? "eager" : "lazy"} onError={event => { event.currentTarget.style.visibility = "hidden"; }} />
      {tile.price !== null && <figcaption><b>{money(tile.price)}</b><span>{t(tile.note ?? "")}</span></figcaption>}
    </figure>)}
  </div>;
}

/** Hero banner: rotating highlights with real product images (home) or a compact catalogue banner (singles page). */
export function HeroBanner({ home, enabled, featuredCards, cardCount, onOpenBulk, onFilter }: Props) {
  const { locale } = useLocale();
  const l = text[locale === "en" ? "en" : "es"];
  const [api, setApi] = useState<Partial<Record<Key, Tile[]>>>({});
  const keys = useMemo(() => (["singles", "custom", "accessories", "sealed"] as Key[]).filter(key => enabled[key]), [enabled]);
  const [index, setIndex] = useState(0), [paused, setPaused] = useState(false), [reduced, setReduced] = useState(false);
  const active = keys.length ? Math.min(index, keys.length - 1) : 0;

  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  // Product images for the non-singles slides come from the same public product lists the store pages use.
  useEffect(() => {
    if (!home) return;
    const controller = new AbortController();
    const load = async (key: "custom" | "accessories" | "sealed") => {
      try {
        const url = key === "sealed" ? "/api/sealed?home=1" : `/api/shop/${key}?limit=6`;
        const data = await (await fetch(url, { signal: controller.signal })).json();
        const items: CatalogueItem[] = key === "sealed" ? (data.rows?.["latest-releases"] ?? []) : (data.items ?? []);
        setApi(current => ({ ...current, [key]: items.map(item => ({ name: item.name, price: item.price, image: item.attributes?.productCutout || item.imageUrl, note: "" })) }));
      } catch { /* the slide falls back to text only */ }
    };
    (["custom", "accessories", "sealed"] as const).filter(key => enabled[key]).forEach(key => void load(key));
    return () => controller.abort();
  }, [home, enabled]);
  useEffect(() => {
    if (!home || keys.length < 2 || paused || reduced) return;
    const timer = setInterval(() => setIndex(current => (current + 1) % keys.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [home, keys.length, paused, reduced, active]);
  const go = useCallback((next: number) => setIndex((next + keys.length) % keys.length), [keys.length]);

  const cardTiles: Tile[] = featuredCards.filter(card => card.imageUrl && card.price !== null).slice(0, 3).map(card => ({ name: card.name, price: card.price, image: card.imageUrl, note: card.condition === "Near Mint" ? "NM" : card.condition }));
  const tilesFor = (key: Key): Tile[] => key === "singles" ? cardTiles : (api[key] ?? []);

  // ---- singles page: compact catalogue banner ----
  if (!home) {
    return <section id="top" className="hb hb-page" aria-label={l.page.title}>
      <div className="hb-decor" aria-hidden="true" />
      <div className="hb-inner">
        <div className="hb-copy">
          <p className="hb-eyebrow">{l.page.eyebrow}</p>
          <h1>{l.page.title}</h1>
          <p className="hb-text">{l.page.copy}</p>
          {typeof cardCount === "number" && cardCount > 0 && <p className="hb-count">{l.page.found(cardCount)}</p>}
          <div className="hb-actions">
            {onFilter && (["added", "latest", "all"] as const).map(kind => <button key={kind} type="button" className="hb-chip" onClick={() => onFilter(kind)}>{l.chips[kind]}</button>)}
            {enabled.bulk && <button type="button" className="hb-btn hb-btn-solid" aria-haspopup="dialog" onClick={onOpenBulk}>{l.page.bulk} →</button>}
          </div>
        </div>
        <Visual tiles={cardTiles} priority />
      </div>
    </section>;
  }

  if (!keys.length) return null;
  const slideName = (key: Key) => l.names[key];
  const hrefOf = (key: Key) => key === "singles" ? "/singles" : key === "sealed" ? "/sealed" : shopSections[key].path;
  return <section id="top" className="hb" aria-roledescription="carousel" aria-label={l.label} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <div className="hb-decor" aria-hidden="true" />
    <div className="hb-stage">
      {keys.map((key, position) => {
        const copy = l[key];
        const isActive = position === active;
        return <div key={key} className={`hb-inner hb-slide${isActive ? " is-active" : ""}`} role="group" aria-roledescription="slide" aria-label={`${position + 1} / ${keys.length}: ${slideName(key)}`} aria-hidden={!isActive} inert={!isActive}>
          <div className="hb-copy">
            <p className="hb-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title[0]}<br />{copy.title[1]}</h1>
            <p className="hb-text">{copy.copy}</p>
            <div className="hb-actions">
              <Link className="hb-btn hb-btn-solid" href={hrefOf(key)}>{copy.cta} →</Link>
              {key === "singles" && enabled.bulk && <button type="button" className="hb-btn hb-btn-ghost" aria-haspopup="dialog" onClick={onOpenBulk}>{l.singles.secondary}</button>}
            </div>
            {key === "singles" && <div className="hb-actions hb-chips">
              <Link className="hb-chip" href="/singles?view=added">{l.chips.added}</Link>
              <Link className="hb-chip" href="/singles?view=latest">{l.chips.latest}</Link>
            </div>}
            <ul className="hb-trust">{l.trust.map((item, i) => <li key={item}>{i === 2 ? `${item} · ${joinNames(shippingProviders, locale)}` : item}</li>)}</ul>
          </div>
          <Visual tiles={tilesFor(key)} priority={position === 0} max={key === "custom" ? 2 : 3} />
        </div>;
      })}
    </div>
    {keys.length > 1 && <div className="hb-controls">
      <button type="button" className="hb-arrow" aria-label={l.prev} onClick={() => go(active - 1)}>←</button>
      <div className="hb-dots" role="tablist">{keys.map((key, position) => <button key={key} type="button" role="tab" aria-selected={position === active} aria-label={slideName(key)} className={position === active ? "is-active" : ""} onClick={() => go(position)}><span>{slideName(key)}</span><i style={position === active && !paused && !reduced ? { animationDuration: `${ROTATE_MS}ms` } : undefined} /></button>)}</div>
      <button type="button" className="hb-arrow" aria-label={l.next} onClick={() => go(active + 1)}>→</button>
    </div>}
    <Link className="sr-only" href={pagePaths.about}>{l.label}</Link>
  </section>;
}
