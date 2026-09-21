"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useCommerce } from "@/presentation/use-commerce";
import { CardImage } from "@/presentation/card-image";
import { cartItemCount, cartTotal } from "@/application/cart";
import { isOutOfStock } from "@/application/catalogue";
import type { CatalogueItem } from "@/domain/commerce";

import type { CatalogueFilter } from "@/domain/set-directory";
import { filterCatalogue } from "@/application/filter-catalogue";
import { useSetDirectory } from "@/presentation/use-set-directory";
import { SetSidebar } from "@/presentation/set-sidebar";

const price = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Home() {
  const [cardScale, setCardScale] = useState(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>({ kind: "all" });
  const directory = useSetDirectory();
  const commerce = useCommerce();
  const { cards, cart, customer } = commerce;
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const results = useMemo(() => filterCatalogue(cards, query, filter, directory.latestSetCodes, directory.hottest), [cards, query, filter, directory.latestSetCodes, directory.hottest]);
  const itemCount = cartItemCount(cart);
  const total = cartTotal(cart);

  async function add(card: CatalogueItem) {
    const currentQuantity = cart.find(line => line.id === card.id)?.quantity ?? 0;
    if (card.stock !== null && currentQuantity >= card.stock) {
      setNotice(`Only ${card.stock} ${card.stock === 1 ? "copy is" : "copies are"} available for ${card.name}.`);
      return;
    }
    if (await commerce.add(card)) {
      const nextQuantity = currentQuantity + 1;
      setNotice(`${card.name} added to cart · ${nextQuantity} ${nextQuantity === 1 ? "copy" : "copies"} in cart`);
    }
  }
  function quantity(id: string, next: number) { void commerce.quantity(id, next); }
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await commerce.login(email, password)) { setPassword(""); setLoginOpen(false); }
  }

  return <main>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Banned Cards home">BANNED <span>CARDS</span></Link>
      <form className="header-search" role="search" onSubmit={event => { event.preventDefault(); document.getElementById("singles")?.scrollIntoView(); }}>
        <label htmlFor="card-search" className="sr-only">Search cards or expansions</label>
        <input id="card-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setFilter({ kind: "all" }); }} placeholder="Search cards or expansions…" />
        <button type="submit">Search</button>
      </form>
      <button className="cart header-cart" type="button" aria-label={`Open cart, ${itemCount} items`} onClick={() => setCartOpen(true)}>Cart <b>{itemCount}</b></button>
    </header>
    <div className="cart-notice" role="status" aria-live="polite" aria-atomic="true">{notice && <span>{notice}</span>}</div>
    {commerce.loading && <p role="status">Loading store…</p>}
    {commerce.error && <p role="alert">{commerce.error} <button type="button" disabled={commerce.busy || commerce.loading} onClick={() => void commerce.retry()}>Retry</button></p>}
    <section id="top" className="hero"><p className="eyebrow">Magic: The Gathering · Chile</p><h1>Find the next card<br />for your deck.</h1><p className="hero-copy">Singles from the newest Magic releases and the journey through Middle-earth. Every listing is the exact card you will receive.</p><a className="button" href="#singles">Browse singles</a></section>
    <section id="singles" className="catalogue"><div className="section-head"><div><p className="eyebrow">Complete catalogue</p><h2>{filter.kind === "hottest" ? "The hottest" : filter.kind === "latest" ? "Latest releases" : filter.kind === "set" ? filter.name : "Magic singles"}</h2>{filter.kind === "hottest" && <p className="ranking-caption">Best sellers over the last 30 days</p>}</div><span>{results.length} cards found</span></div><div className="catalogue-layout"><SetSidebar directory={directory} selected={filter} onSelect={setFilter} cardScale={cardScale} onCardScaleChange={setCardScale} /><div className="card-grid" style={{ "--card-scale": cardScale } as CSSProperties}>{filter.kind === "latest" && directory.loading && <p role="status">Loading latest releases…</p>}{filter.kind === "hottest" && directory.hottestLoading && <p role="status">Loading best sellers…</p>}{filter.kind === "hottest" && directory.hottestError && <p role="alert">{directory.hottestError} <button type="button" onClick={directory.retryHottest}>Retry</button></p>}{filter.kind === "latest" && directory.error && <p role="alert">Latest releases are unavailable. <button type="button" onClick={directory.retry}>Retry</button></p>}{!commerce.loading && !commerce.error && !(filter.kind === "hottest" && (directory.hottestLoading || directory.hottestError)) && !(filter.kind === "latest" && (directory.loading || directory.error)) && results.length === 0 && <p>{filter.kind === "hottest" && directory.hottest.length === 0 ? "No sales to rank in the last 30 days yet." : "No items match this selection."}</p>}{results.map((card) => { const inCart = cart.find(line => line.id === card.id)?.quantity ?? 0; const soldOut = isOutOfStock(card); const atStockLimit = card.stock !== null && inCart >= card.stock; return <article className={`product${soldOut ? " is-out-of-stock" : ""}`} key={card.id}><div className={`card-art ${card.theme}`}><CardImage item={card} /></div><div className="product-details"><p className="set">{card.set}</p><h3>{card.name}</h3><p className="variant">{card.finish} · {card.condition}</p><div className="product-footer"><strong>{card.price === null ? "Price unavailable" : price(card.price)}</strong><button type="button" disabled={commerce.disabled || atStockLimit} onClick={() => void add(card)}>{soldOut ? "Out of stock" : atStockLimit ? "All in cart" : inCart > 0 ? "Add another" : "Add"}</button></div><small>{card.stock === null ? "Available to order" : `${card.stock} in stock`}{inCart > 0 ? ` · ${inCart} in cart` : ""}{atStockLimit && !soldOut ? " · stock limit reached" : ""}</small></div></article>; })}</div></div></section>
    <section className="promises"><div><span>01</span><h2>Honest grading</h2><p>Every card is checked against our condition guide before it is listed.</p></div><div><span>02</span><h2>Real inventory</h2><p>Adding cards to your cart does not reserve stock. Checkout and payment are coming next.</p></div><div><span>03</span><h2>Built to expand</h2><p>The catalogue model supports Magic today and new TCGs tomorrow.</p></div></section><footer id="about"><a className="brand" href="#top">BANNED <span>CARDS</span></a><p>{commerce.demoMode ? "Demo storefront · prices and stock are illustrative." : "Powered by Medusa · checkout is not yet available."}</p><a href="/cms">Staff CMS ↗</a></footer>
    {cartOpen && <div className="overlay"><aside className="drawer"><div className="drawer-head"><div><p className="eyebrow">Your selection</p><h2>Cart</h2></div><button className="close" type="button" onClick={() => setCartOpen(false)}>×</button></div><button className="text-button" type="button" disabled={commerce.disabled} onClick={() => { if (customer) void commerce.logout(); else { setCartOpen(false); setLoginOpen(true); } }}>{customer ? `Log out ${customer}` : "Log in to your account"}</button>{cart.length === 0 ? <p className="empty">Your cart is empty. Add a card to begin.</p> : <><div className="cart-lines">{cart.map((item) => { const availableStock = cards.find(card => card.id === item.id)?.stock ?? item.stock; const atStockLimit = availableStock !== null && item.quantity >= availableStock; return <div className="cart-line" key={item.id}><div className={`cart-mini ${item.theme}`}><CardImage item={item} compact /></div><div><strong>{item.name}</strong><small>{item.finish} · {item.condition}{atStockLimit ? " · stock limit reached" : ""}</small><span>{price(item.price)}</span></div><div className="quantity"><button type="button" disabled={commerce.disabled} onClick={() => quantity(item.lineId ?? item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button type="button" aria-label={atStockLimit ? `No more ${item.name} in stock` : `Add one more ${item.name}`} title={atStockLimit ? "No more copies in stock" : "Add one more"} disabled={commerce.disabled || atStockLimit} onClick={() => quantity(item.lineId ?? item.id, item.quantity + 1)}>+</button></div></div>; })}</div>{commerce.error && <p role="alert">{commerce.error}</p>}<div className="cart-total"><span>Subtotal</span><strong>{price(total)}</strong></div><button className="checkout" type="button" disabled>Continue to checkout</button><p className="checkout-note">Secure Mercado Pago checkout is the next payment milestone.</p></>}</aside></div>}
    {loginOpen && <div className="overlay modal-wrap"><form className="login-modal" onSubmit={login}><button className="close modal-close" type="button" onClick={() => { setPassword(""); setLoginOpen(false); }}>×</button><p className="eyebrow">{commerce.demoMode ? "Demo account" : "Customer account"}</p><h2>Welcome back</h2><p>{commerce.demoMode ? "Sign in locally to preview the demo." : "Sign in with your existing store account."}</p><label htmlFor="email">Email address</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />{!commerce.demoMode && <><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></>}{commerce.error && <p role="alert">{commerce.error}</p>}<button className="checkout" type="submit" disabled={commerce.disabled}>Continue</button></form></div>}
  </main>;
}
