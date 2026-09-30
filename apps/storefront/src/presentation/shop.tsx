"use client";
import {useSections} from "./sections-provider";
import {GoogleButton} from "./google-button";
import {useLocale} from "./locale-provider";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BuyCards } from "@/presentation/buy-cards";
import { HeroCarousel } from "@/presentation/hero-carousel";
import { ShopMenu } from "@/presentation/shop-menu";
import { AccountPanel } from "@/presentation/account-panel";
import {registerAccount} from "@/adapters/account-repository";
import { useCommerce } from "@/presentation/use-commerce";
import { CardImage } from "@/presentation/card-image";
import { cartItemCount, cartTotal } from "@/application/cart";
import { groupCards } from "@/application/group-cards";
import { ProductCard } from "@/presentation/product-card";
import type { CatalogueItem } from "@/domain/commerce";

import type { CatalogueFilter } from "@/domain/set-directory";
import { useCataloguePages } from "@/presentation/use-catalogue-pages";
import { useSetDirectory } from "@/presentation/use-set-directory";
import { SealedBrowser } from "@/presentation/sealed-browser";
import type { SealedView } from "@/config/sealed";
import { SetSidebar } from "@/presentation/set-sidebar";

const price = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export function Shop({ singles = false, sealedView, initialLanguage, buyCards=false }: { buyCards?:boolean; singles?: boolean; sealedView?: SealedView; initialLanguage?: string }) {
 const {t}=useLocale();
 const sections=useSections();
  const [bulkOpenRequest,setBulkOpenRequest]=useState(0);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>({ kind: "added" });
  const directory = useSetDirectory();
  const commerce = useCommerce();
  const { cart, customer } = commerce;
  const catalogue = useCataloguePages({q:singles ? query : "",showOutOfStock, ...(!singles ? {limit:20} : {}), ...(singles && filter.kind === "set" ? {sets:filter.setCodes ?? [filter.code]} : singles && filter.kind === "latest" ? {sets:directory.latestSetCodes} : singles && filter.kind === "added" ? {sort:"added" as const} : {})}, !buyCards && sealedView === undefined && !(filter.kind === "latest" && (directory.loading || Boolean(directory.error))));
  const cards = catalogue.cards;
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [register,setRegister]=useState(false);
  const [firstName,setFirstName]=useState("");
  const [authError,setAuthError]=useState("");
  const [authBusy,setAuthBusy]=useState(false);
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
    event.preventDefault();if(authBusy)return;setAuthBusy(true);setAuthError("");
    try{
      if(register&&!commerce.demoMode)await registerAccount(email,password,firstName);
      if(await commerce.login(email,password)){setPassword("");setLoginOpen(false);setAccountOpen(true);}
    }catch(error){setAuthError(error instanceof Error?error.message:"Unable to sign in.");}
    finally{setAuthBusy(false);}
  }


  return <main>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Banned Cards home">BANNED <span>CARDS</span></Link>
      <form className="header-search" role="search" onSubmit={event => { event.preventDefault(); document.getElementById(singles ? "singles" : "sealed")?.scrollIntoView(); }}>
        <label htmlFor="card-search" className="sr-only">{t("Search products")}</label>
        <input id="card-search" type="search" value={query} onChange={event => { setQuery(event.target.value); if (singles) setFilter({ kind: "all" }); }} placeholder={t("Search products…")} />
        <button type="submit">{t("Search")}</button>
      </form>
      <button className="cart header-cart" type="button" aria-label={`Open cart, ${itemCount} items`} onClick={() => setCartOpen(true)}>{t("Cart")}<b>{itemCount}</b></button>
      <ShopMenu customer={customer} onAccount={()=>customer?setAccountOpen(true):setLoginOpen(true)}/>
    </header>
    <nav className="shop-nav" aria-label="Shop"><Link href="/" aria-current={!buyCards && !singles && sealedView === undefined ? "page" : undefined}>{t("Home")}</Link>{sections.sealed&&<Link href="/sealed" aria-current={sealedView !== undefined ? "page" : undefined}>{t("Sealed")}</Link>}<Link href="/singles" aria-current={singles ? "page" : undefined}>{t("Singles")}</Link></nav>
    <div className="cart-notice" role="status" aria-live="polite" aria-atomic="true">{notice && <span>{notice}</span>}</div>
    {commerce.loading && <span className="sr-only" role="status">{t("Loading store\u2026")}</span>}
    {commerce.error && <p role="alert">{commerce.error} <button type="button" disabled={commerce.busy || commerce.loading} onClick={() => void commerce.retry()}>{t("Retry")}</button></p>}
    <HeroCarousel sealedEnabled={sections.sealed} bulkEnabled={sections.bulkFinder} hideBanner={buyCards||sealedView!==undefined||(!singles&&!sections.homeBanner)} openRequest={bulkOpenRequest} home={!singles} cart={cart} disabled={commerce.disabled} onAdd={commerce.addBulk} onOpenCart={() => setCartOpen(true)} />
    {buyCards&&<BuyCards/>}
    {sections.sealed && (sealedView!==undefined||sections.homeSealed) && !buyCards && !singles && <SealedBrowser key={JSON.stringify([sealedView,initialLanguage])} home={sealedView === undefined} view={sealedView} initialLanguage={initialLanguage} query={query} cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />}
    {(singles||sections.homeSingles) && !buyCards && sealedView === undefined && <section id="singles" className="catalogue"><div className="section-head"><div><p className="eyebrow">{singles ? t("Complete catalogue") : t("Featured singles")}</p><h2>{!singles ? t("Most expensive cards") : filter.kind === "added" ? t("Latest added") : filter.kind === "latest" ? t("Latest releases") : filter.kind === "set" ? filter.name : t("Magic singles")}</h2>{(!singles || filter.kind === "added") && <p className="ranking-caption">{t(singles ? "Newest additions to our catalogue" : "Our 20 most expensive available cards")}</p>}</div>{singles ? <span>{catalogue.count} {t("cards found")}</span> : <Link className="button" href="/singles">{t("Browse all singles →")}</Link>}</div><div className={singles ? "catalogue-layout" : ""}>{singles && <SetSidebar showOutOfStock={showOutOfStock} onShowOutOfStockChange={setShowOutOfStock} directory={directory} selected={filter} onSelect={setFilter} cardScale={cardScale} onCardScaleChange={setCardScale} />}<div className="card-grid" style={{ "--card-scale": cardScale } as CSSProperties}>{filter.kind === "latest" && directory.loading && <p role="status">{t("Loading latest releases\u2026")}</p>}{filter.kind === "latest" && directory.error && <p role="alert">Latest releases are unavailable. <button type="button" onClick={directory.retry}>{t("Retry")}</button></p>}{!catalogue.loading && !catalogue.error && !(filter.kind === "latest" && (directory.loading || directory.error)) && results.length === 0 && <p>{t("No items match this selection.")}</p>}{(singles ? groupedCards : groupedCards.slice(0, 20)).map(group => <ProductCard key={group.id} group={group} cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />)}{singles && <div className="catalogue-pagination" ref={catalogue.sentinel}>{catalogue.loading && <p role="status">{t("Loading cards\u2026")}</p>}{catalogue.error && <p role="alert">{catalogue.error} <button type="button" onClick={catalogue.retry}>{t("Retry")}</button></p>}{!catalogue.loading && !catalogue.error && catalogue.nextOffset !== null && <button type="button" onClick={catalogue.more}>{t("Load more cards")}</button>}</div>}{!singles && catalogue.loading && <p role="status">{t("Loading latest singles\u2026")}</p>}{!singles && catalogue.error && <p role="alert">{catalogue.error} <button onClick={catalogue.retry}>{t("Retry")}</button></p>}</div></div></section>}
    <section className="promises" aria-label="About our store">{sections.buyCards&&<div><h2>{t("We buy your cards")}</h2><p>{t("Give the cards you no longer play a new home. Find out how we value your collection and check our buying rates.")}</p><Link className="service-link" href="/sell-cards">{t("See our buying rates →")}</Link></div>}{sections.bulkFinder&&<div><h2>{t("Find your whole list")}</h2><p>{t("Building a deck? Paste your card list, check our available stock, and add your matches to the cart.")}</p><button className="service-link" type="button" aria-haspopup="dialog" onClick={()=>setBulkOpenRequest(value=>value+1)}>{t("Open bulk finder →")}</button></div>}{sections.family&&<div><h2>{t("A small family business")}</h2><p>{t("We’re a small, family-run business in Chile. Thank you for supporting our shop and sharing your love of cards with us.")}</p></div>}</section><footer id="about"><a className="brand" href="#top">BANNED <span>CARDS</span></a><p>{commerce.demoMode ? t("Demo storefront · prices and stock are illustrative.") : t("Powered by Medusa · checkout is not yet available.")}</p><a href="/cms">{t("Staff CMS ↗")}</a></footer>
    {cartOpen && <div className="overlay"><aside className="drawer"><div className="drawer-head"><div><p className="eyebrow">{t("Your selection")}</p><h2>{t("Cart")}</h2></div><button className="close" type="button" onClick={() => setCartOpen(false)}>×</button></div><button className="text-button" type="button" disabled={commerce.disabled} onClick={() => { if (customer) void commerce.logout(); else { setCartOpen(false); setLoginOpen(true); } }}>{customer ? `${t("Log out")} ${customer}` : t("Log in to your account")}</button>{cart.length === 0 ? <p className="empty">{t("Your cart is empty. Add a card to begin.")}</p> : <><div className="cart-lines">{cart.map((item) => { const availableStock = cards.find(card => card.id === item.id)?.stock ?? item.stock; const atStockLimit = availableStock !== null && item.quantity >= availableStock; return <div className="cart-line" key={item.id}><div className={`cart-mini ${item.theme}`}><CardImage item={item} compact /></div><div><strong>{item.name}</strong><small>{t(item.finish)} · {t(item.condition)}{atStockLimit ? ` · ${t("stock limit reached")}` : ""}</small><span>{price(item.price)}</span></div><div className="quantity"><button type="button" disabled={commerce.disabled} onClick={() => quantity(item.lineId ?? item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button type="button" aria-label={atStockLimit ? `No more ${item.name} in stock` : `Add one more ${item.name}`} title={atStockLimit ? "No more copies in stock" : "Add one more"} disabled={commerce.disabled || atStockLimit} onClick={() => quantity(item.lineId ?? item.id, item.quantity + 1)}>+</button></div></div>; })}</div>{commerce.error && <p role="alert">{commerce.error}</p>}<div className="cart-total"><span>{t("Subtotal")}</span><strong>{price(total)}</strong></div><button className="checkout" type="button" disabled>{t("Continue to checkout")}</button><p className="checkout-note">{t("Secure Mercado Pago checkout is the next payment milestone.")}</p></>}</aside></div>}
    {accountOpen && <AccountPanel customer={customer} demo={commerce.demoMode} onClose={()=>setAccountOpen(false)} onLogout={()=>{void commerce.logout().then(success=>{if(success)setAccountOpen(false);});}}/>}
    {loginOpen && <div className="overlay modal-wrap"><form className="login-modal" onSubmit={login}><button className="close modal-close" type="button" onClick={() => { setPassword(""); setLoginOpen(false); }}>×</button><p className="eyebrow">{commerce.demoMode ? t("Demo account") : t("Customer account")}</p><h2>{t(register?"Create account":"Welcome back")}</h2><p>{commerce.demoMode ? t("Sign in locally to preview the demo.") : t("Sign in with your existing store account.")}</p>{register&&<><label htmlFor="first-name">{t("First name")}</label><input id="first-name" required autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)}/></>}<label htmlFor="email">{t("Email address")}</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />{!commerce.demoMode && <><label htmlFor="password">{t("Password")}</label><input id="password" type="password" autoComplete={register?"new-password":"current-password"} minLength={register?8:undefined} required value={password} onChange={event => setPassword(event.target.value)} /></>}{commerce.error && <p role="alert">{commerce.error}</p>}{authError&&<p role="alert">{t(authError)}</p>}<button className="checkout" type="submit" disabled={commerce.disabled||authBusy}>{t(authBusy?"Loading…":"Continue")}</button>{!commerce.demoMode&&<GoogleButton/>}{!commerce.demoMode&&<button type="button" className="service-link" onClick={()=>{setRegister(v=>!v);setAuthError("");}}>{t(register?"Log in":"Create account")}</button>}</form></div>}
  </main>;
}
