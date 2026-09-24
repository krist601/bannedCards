"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { HeroCarousel } from "@/presentation/hero-carousel";
import { ThemePicker } from "@/presentation/theme-provider";
import { useCommerce } from "@/presentation/use-commerce";
import { CardImage } from "@/presentation/card-image";
import { cartItemCount, cartTotal } from "@/application/cart";
import { groupCards } from "@/application/group-cards";
import { ProductCard } from "@/presentation/product-card";
import type { CatalogueItem } from "@/domain/commerce";

import type { CatalogueFilter } from "@/domain/set-directory";
import { useCataloguePages } from "@/presentation/use-catalogue-pages";
import { useSetDirectory } from "@/presentation/use-set-directory";
import { SetSidebar } from "@/presentation/set-sidebar";

const price = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Home() {
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>({ kind: "added" });
  const directory = useSetDirectory();
  const commerce = useCommerce();
  const { cart, customer } = commerce;
  const catalogue = useCataloguePages({q:query,showOutOfStock, ...(filter.kind === "set" ? {sets:filter.setCodes ?? [filter.code]} : filter.kind === "latest" ? {sets:directory.latestSetCodes} : filter.kind === "added" ? {sort:"added" as const} : {})}, !(filter.kind === "latest" && (directory.loading || Boolean(directory.error))));
  const cards = catalogue.cards;
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

  const results = cards;
  const groupedCards = useMemo(() => groupCards(results), [results]);
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
      <ThemePicker />
      <button className="cart header-cart" type="button" aria-label={`Open cart, ${itemCount} items`} onClick={() => setCartOpen(true)}>Cart <b>{itemCount}</b></button>
    </header>
    <div className="cart-notice" role="status" aria-live="polite" aria-atomic="true">{notice && <span>{notice}</span>}</div>
    {commerce.loading && <p role="status">Loading store…</p>}
    {commerce.error && <p role="alert">{commerce.error} <button type="button" disabled={commerce.busy || commerce.loading} onClick={() => void commerce.retry()}>Retry</button></p>}
    <HeroCarousel cart={cart} disabled={commerce.disabled} onAdd={commerce.addBulk} onOpenCart={() => setCartOpen(true)} />
    <section id="singles" className="catalogue"><div className="section-head"><div><p className="eyebrow">Complete catalogue</p><h2>{filter.kind === "added" ? "Latest added" : filter.kind === "latest" ? "Latest releases" : filter.kind === "set" ? filter.name : "Magic singles"}</h2>{filter.kind === "added" && <p className="ranking-caption">Newest additions to our catalogue</p>}</div><span>{catalogue.count} cards found</span></div><div className="catalogue-layout"><SetSidebar showOutOfStock={showOutOfStock} onShowOutOfStockChange={setShowOutOfStock} directory={directory} selected={filter} onSelect={setFilter} cardScale={cardScale} onCardScaleChange={setCardScale} /><div className="card-grid" style={{ "--card-scale": cardScale } as CSSProperties}>{filter.kind === "latest" && directory.loading && <p role="status">Loading latest releases…</p>}{filter.kind === "latest" && directory.error && <p role="alert">Latest releases are unavailable. <button type="button" onClick={directory.retry}>Retry</button></p>}{!catalogue.loading && !catalogue.error && !(filter.kind === "latest" && (directory.loading || directory.error)) && results.length === 0 && <p>No items match this selection.</p>}{groupedCards.map(group => <ProductCard key={group.id} group={group} cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />)}<div className="catalogue-pagination" ref={catalogue.sentinel}>{catalogue.loading && <p role="status">Loading cards…</p>}{catalogue.error && <p role="alert">{catalogue.error} <button type="button" onClick={catalogue.retry}>Retry</button></p>}{!catalogue.loading && !catalogue.error && catalogue.nextOffset !== null && <button type="button" onClick={catalogue.more}>Load more cards</button>}</div></div></div></section>
    <section className="promises"><div><span>01</span><h2>Honest grading</h2><p>Every card is checked against our condition guide before it is listed.</p></div><div><span>02</span><h2>Real inventory</h2><p>Adding cards to your cart does not reserve stock. Checkout and payment are coming next.</p></div><div><span>03</span><h2>Built to expand</h2><p>The catalogue model supports Magic today and new TCGs tomorrow.</p></div></section><footer id="about"><a className="brand" href="#top">BANNED <span>CARDS</span></a><p>{commerce.demoMode ? "Demo storefront · prices and stock are illustrative." : "Powered by Medusa · checkout is not yet available."}</p><a href="/cms">Staff CMS ↗</a></footer>
    {cartOpen && <div className="overlay"><aside className="drawer"><div className="drawer-head"><div><p className="eyebrow">Your selection</p><h2>Cart</h2></div><button className="close" type="button" onClick={() => setCartOpen(false)}>×</button></div><button className="text-button" type="button" disabled={commerce.disabled} onClick={() => { if (customer) void commerce.logout(); else { setCartOpen(false); setLoginOpen(true); } }}>{customer ? `Log out ${customer}` : "Log in to your account"}</button>{cart.length === 0 ? <p className="empty">Your cart is empty. Add a card to begin.</p> : <><div className="cart-lines">{cart.map((item) => { const availableStock = cards.find(card => card.id === item.id)?.stock ?? item.stock; const atStockLimit = availableStock !== null && item.quantity >= availableStock; return <div className="cart-line" key={item.id}><div className={`cart-mini ${item.theme}`}><CardImage item={item} compact /></div><div><strong>{item.name}</strong><small>{item.finish} · {item.condition}{atStockLimit ? " · stock limit reached" : ""}</small><span>{price(item.price)}</span></div><div className="quantity"><button type="button" disabled={commerce.disabled} onClick={() => quantity(item.lineId ?? item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button type="button" aria-label={atStockLimit ? `No more ${item.name} in stock` : `Add one more ${item.name}`} title={atStockLimit ? "No more copies in stock" : "Add one more"} disabled={commerce.disabled || atStockLimit} onClick={() => quantity(item.lineId ?? item.id, item.quantity + 1)}>+</button></div></div>; })}</div>{commerce.error && <p role="alert">{commerce.error}</p>}<div className="cart-total"><span>Subtotal</span><strong>{price(total)}</strong></div><button className="checkout" type="button" disabled>Continue to checkout</button><p className="checkout-note">Secure Mercado Pago checkout is the next payment milestone.</p></>}</aside></div>}
    {loginOpen && <div className="overlay modal-wrap"><form className="login-modal" onSubmit={login}><button className="close modal-close" type="button" onClick={() => { setPassword(""); setLoginOpen(false); }}>×</button><p className="eyebrow">{commerce.demoMode ? "Demo account" : "Customer account"}</p><h2>Welcome back</h2><p>{commerce.demoMode ? "Sign in locally to preview the demo." : "Sign in with your existing store account."}</p><label htmlFor="email">Email address</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />{!commerce.demoMode && <><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></>}{commerce.error && <p role="alert">{commerce.error}</p>}<button className="checkout" type="submit" disabled={commerce.disabled}>Continue</button></form></div>}
  </main>;
}
