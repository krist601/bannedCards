"use client";
import { BrandLogo } from "./brand-logo";
import {useSections} from "./sections-provider";
import {useLocale} from "./locale-provider";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { AuthValues } from "@/presentation/auth-dialog";
import { ServiceHighlights } from "@/presentation/service-highlights";
import { SiteFooter } from "@/presentation/site-footer";
import { ShopSectionBrowser } from "@/presentation/shop-section-browser";
import type { ShopSectionKey } from "@/config/shop-sections";
import { HeroCarousel } from "@/presentation/hero-carousel";
import { ShopMenu } from "@/presentation/shop-menu";
import { useRouter } from "next/navigation";
import { accountPath, checkoutPath } from "@/config/site";
import {registerAccount,sendEmailVerification} from "@/adapters/account-repository";
import { useCommerce } from "@/presentation/use-commerce";
import { cartHasUnavailable, cartItemCount, cartTotal } from "@/application/cart";
import { CartLineView } from "@/presentation/cart-line";
import { groupCards } from "@/application/group-cards";
import { ProductCard } from "@/presentation/product-card";
import type { CatalogueItem } from "@/domain/commerce";

import type { CatalogueFilter } from "@/domain/set-directory";
import { useCataloguePages } from "@/presentation/use-catalogue-pages";
import { useSetDirectory } from "@/presentation/use-set-directory";
import type { SealedView } from "@/config/sealed";
// Rarely used pieces load as separate chunks (still server-rendered where they render on first paint).
const ContentPage = dynamic(() => import("@/presentation/content-page").then(m => m.ContentPage));
const AccountPage = dynamic(() => import("@/presentation/account-page").then(m => m.AccountPage));
const WebpayResult = dynamic(() => import("@/presentation/webpay-result").then(m => m.WebpayResult));
const VerifyEmail = dynamic(() => import("@/presentation/verify-email").then(m => m.VerifyEmail));
const BuyCards = dynamic(() => import("@/presentation/buy-cards").then(m => m.BuyCards));
const loadAuth = () => import("@/presentation/auth-dialog");
const loadCheckout = () => import("@/presentation/checkout-page");
const AuthDialog = dynamic(() => loadAuth().then(m => m.AuthDialog));
const CheckoutPage = dynamic(() => loadCheckout().then(m => m.CheckoutPage));
const SealedBrowser = dynamic(() => import("@/presentation/sealed-browser").then(m => m.SealedBrowser));
const SetSidebar = dynamic(() => import("@/presentation/set-sidebar").then(m => m.SetSidebar));
const warmCart = () => { void loadAuth(); void loadCheckout(); };

const price = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export function Shop({ singles = false, sealedView, initialLanguage, buyCards=false, shopSection, legal }: { legal?: "privacy" | "about" | "terms" | "contact" | "verify-email" | "account" | "checkout" | "webpay-result"; shopSection?: ShopSectionKey; buyCards?:boolean; singles?: boolean; sealedView?: SealedView; initialLanguage?: string }) {
 const {t,locale}=useLocale();
 const sections=useSections();
  const standalone = buyCards || legal !== undefined;
  const [bulkOpenRequest,setBulkOpenRequest]=useState(0);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>({ kind: "added" });
  // Links like /singles?view=latest (from the Home banner) pick the starting filter.
  useEffect(() => { if (!singles) return; const view = new URLSearchParams(window.location.search).get("view"); if (view === "latest" || view === "added" || view === "all") setFilter({ kind: view }); }, [singles]);
  const directory = useSetDirectory(singles);
  const commerce = useCommerce();
  const { cart, customer } = commerce;
  const home = !singles && !standalone && sealedView === undefined && shopSection === undefined;
  const catalogue = useCataloguePages({q:singles ? query : "",showOutOfStock, ...(!singles ? {limit:20} : {}), ...(singles && filter.kind === "set" ? {sets:filter.setCodes ?? [filter.code]} : singles && filter.kind === "latest" ? {sets:directory.latestSetCodes} : singles && filter.kind === "added" ? {sort:"release" as const} : {})}, (singles || home) && !(filter.kind === "latest" && (directory.loading || Boolean(directory.error))));
  const cards = catalogue.cards;
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();
  // A guest pressed "checkout": after creating (or opening) an account the checkout page opens, with the guest cart already saved to it.
  const [checkoutPending,setCheckoutPending]=useState(false);
  const [register,setRegister]=useState(false);
  const [authError,setAuthError]=useState("");
  const [authBusy,setAuthBusy]=useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
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

  // Cart lines come without stock, so remember the stock of products the shopper has seen.
  const knownStock = useRef(new Map<string, number | null>());
  async function add(card: CatalogueItem) {
    knownStock.current.set(card.id, card.stock);
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
  async function startCheckout() {
    const fresh = await commerce.refresh();
    if (!fresh || cartHasUnavailable(fresh)) return;   // sold-out lines stay visible in the cart with their explanation
    if (!customer) { setRegister(true); setAuthError(""); setCheckoutPending(true); setCartOpen(false); setLoginOpen(true); return; }
    setCartOpen(false); router.push(checkoutPath);
  }
  function quantity(id: string, next: number) { void commerce.quantity(id, next); }
  async function submitAuth({ email, password, firstName }: AuthValues) {
    if(authBusy)return;setAuthBusy(true);setAuthError("");
    try{
      if(register&&!commerce.demoMode)await registerAccount(email,password,firstName);
      if(await commerce.login(email,password)){
        // Only accounts created with our own form need an email confirmation; Google accounts arrive already verified.
        if(register&&!commerce.demoMode)await sendEmailVerification(locale).catch(()=>undefined);
        setLoginOpen(false);
        if(checkoutPending){setCheckoutPending(false);const fresh=await commerce.refresh();if(fresh&&!cartHasUnavailable(fresh))router.push(checkoutPath);else setCartOpen(true);}else if(register&&!commerce.demoMode)router.push(`${accountPath}?welcome=1`);
      }
    }catch(error){setAuthError(error instanceof Error?error.message:"Unable to sign in.");}
    finally{setAuthBusy(false);}
  }



  return <main>
    <div className="mobile-shop-bar" role="region" aria-label={t("Cart")}>
      {singles && <div id="mobile-filter-slot" />}
      <div className="mobile-cart-total"><span>{t("Subtotal")}</span><strong>{price(total)}</strong></div>
      <button className="mobile-cart-open" type="button" onPointerEnter={warmCart} onFocus={warmCart} aria-label={`${t("Cart")}: ${itemCount}`} onClick={() => setCartOpen(true)}>
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 3h3l3 12h11l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><b>{itemCount}</b>
      </button>
    </div>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Banned Cards home"><BrandLogo /></Link>
      <form className="header-search" role="search" onSubmit={event => { event.preventDefault(); document.getElementById(singles ? "singles" : "sealed")?.scrollIntoView(); }}>
        <label htmlFor="card-search" className="sr-only">{t("Search products")}</label>
        <input id="card-search" type="search" value={query} onChange={event => { setQuery(event.target.value); if (singles) setFilter({ kind: "all" }); }} placeholder={t("Search products…")} />
        <button type="submit">{t("Search")}</button>
      </form>
      <button className="cart header-cart" type="button" onPointerEnter={warmCart} onFocus={warmCart} aria-label={`Open cart, ${itemCount} items`} onClick={() => setCartOpen(true)}>{t("Cart")}<b>{itemCount}</b></button>
      <ShopMenu customer={customer} onAccount={()=>customer?router.push(accountPath):setLoginOpen(true)}/>
    </header>
    <nav className="shop-nav" aria-label="Shop"><Link href="/" aria-current={!standalone && !singles && sealedView === undefined && shopSection === undefined ? "page" : undefined}>{t("Home")}</Link>{sections.sealed&&<Link href="/sealed" aria-current={sealedView !== undefined ? "page" : undefined}>{t("Sealed")}</Link>}{sections.singles&&<Link href="/singles" aria-current={singles ? "page" : undefined}>{t("Singles")}</Link>}{sections.custom&&<Link href="/custom" aria-current={shopSection === "custom" ? "page" : undefined}>{t("Custom products")}</Link>}{sections.accessories&&<Link href="/accessories" aria-current={shopSection === "accessories" ? "page" : undefined}>{t("Accessories")}</Link>}</nav>
    <div className="cart-notice" role="status" aria-live="polite" aria-atomic="true">{notice && <span>{notice}</span>}</div>
    {commerce.loading && <span className="sr-only" role="status">{t("Loading store\u2026")}</span>}
    {commerce.error && <p role="alert">{commerce.error} <button type="button" disabled={commerce.busy || commerce.loading} onClick={() => void commerce.retry()}>{t("Retry")}</button></p>}
    <HeroCarousel featuredCards={singles?groupedCards.map(group=>group.cards[0]):cards} cardCount={singles?catalogue.count:null} onFilter={singles?(kind=>{setFilter({kind});document.getElementById("singles")?.scrollIntoView({behavior:"smooth"});}):undefined} sealedEnabled={sections.sealed} singlesEnabled={sections.singles} customEnabled={sections.custom} accessoriesEnabled={sections.accessories} bulkEnabled={sections.bulkFinder} hideBanner={standalone||sealedView!==undefined||shopSection!==undefined||(!singles&&!sections.homeBanner)} openRequest={bulkOpenRequest} home={!singles} cart={cart} disabled={commerce.disabled} onAdd={commerce.addBulk} onOpenCart={() => setCartOpen(true)} />
    {buyCards&&<BuyCards/>}
    {(legal==="privacy"||legal==="about"||legal==="terms"||legal==="contact")&&<ContentPage page={legal}/>}
    {legal==="verify-email"&&<VerifyEmail/>}
    {legal==="webpay-result"&&<WebpayResult price={price} onApproved={commerce.forgetCart} />}
    {legal==="checkout"&&<CheckoutPage cart={cart} customer={customer} loading={commerce.loading} demo={commerce.demoMode} payments={{webpay:sections.webpay,test:sections.testCheckout}} onWebpay={contact=>commerce.startWebpay(contact,locale)} price={price} onLogin={()=>{setRegister(true);setAuthError("");setLoginOpen(true);}} onSubmit={contact=>commerce.checkout(contact,locale)} />}
    {legal==="account"&&<AccountPage customer={customer} loading={commerce.loading} demo={commerce.demoMode} onLogin={()=>setLoginOpen(true)} onNameChange={commerce.setCustomerName} onLogout={()=>{void commerce.logout().then(success=>{if(success)router.push("/");});}} />}
    {sections.sealed && (sealedView!==undefined||sections.homeSealed) && !standalone && !singles && shopSection===undefined && <SealedBrowser key={JSON.stringify([sealedView,initialLanguage])} home={sealedView === undefined} view={sealedView} initialLanguage={initialLanguage} query={query} cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />}
    {sections.singles && (singles||sections.homeSingles) && !standalone && sealedView === undefined && shopSection === undefined && <section id="singles" className="catalogue"><div className="section-head"><div><p className="eyebrow">{singles ? t("Complete catalogue") : t("Featured singles")}</p><h2>{!singles ? t("Most expensive cards") : filter.kind === "added" ? t("Latest added") : filter.kind === "latest" ? t("Latest releases") : filter.kind === "set" ? filter.name : t("Magic singles")}</h2>{(!singles || filter.kind === "added") && <p className="ranking-caption">{t(singles ? "Newest additions to our catalogue" : "Our 20 most expensive available cards")}</p>}</div>{singles ? <span>{catalogue.count} {t("cards found")}</span> : <Link className="button" href="/singles">{t("Browse all singles →")}</Link>}</div><div className={singles ? "catalogue-layout" : ""}>{singles && <SetSidebar showOutOfStock={showOutOfStock} onShowOutOfStockChange={setShowOutOfStock} directory={directory} selected={filter} onSelect={setFilter} cardScale={cardScale} onCardScaleChange={setCardScale} />}<div className="card-grid" style={{ "--card-scale": cardScale } as CSSProperties}>{filter.kind === "latest" && directory.loading && <p role="status">{t("Loading latest releases\u2026")}</p>}{filter.kind === "latest" && directory.error && <p role="alert">Latest releases are unavailable. <button type="button" onClick={directory.retry}>{t("Retry")}</button></p>}{!catalogue.loading && !catalogue.error && !(filter.kind === "latest" && (directory.loading || directory.error)) && results.length === 0 && <p>{t("No items match this selection.")}</p>}{(singles ? groupedCards : groupedCards.slice(0, 20)).map(group => <ProductCard key={group.id} group={group} cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />)}{singles && <div className="catalogue-pagination" ref={catalogue.sentinel}>{catalogue.loading && <p role="status">{t("Loading cards\u2026")}</p>}{catalogue.error && <p role="alert">{catalogue.error} <button type="button" onClick={catalogue.retry}>{t("Retry")}</button></p>}{!catalogue.loading && !catalogue.error && catalogue.nextOffset !== null && <button type="button" onClick={catalogue.more}>{t("Load more cards")}</button>}</div>}{!singles && catalogue.loading && <p role="status">{t("Loading latest singles\u2026")}</p>}{!singles && catalogue.error && <p role="alert">{catalogue.error} <button onClick={catalogue.retry}>{t("Retry")}</button></p>}</div></div></section>}
{shopSection && sections[shopSection] && !standalone && sealedView === undefined && !singles && <ShopSectionBrowser onSeen={items => items.forEach(item => knownStock.current.set(item.id, item.stock))} section={shopSection} query={query} cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />}
    {!shopSection && !singles && !standalone && sealedView === undefined && (["custom","accessories"] as const).map(key => sections[key] && sections[key === "custom" ? "homeCustom" : "homeAccessories"] && <ShopSectionBrowser onSeen={items => items.forEach(item => knownStock.current.set(item.id, item.stock))} key={key} home section={key} query="" cart={cart} disabled={commerce.disabled} onAdd={card => void add(card)} />)}
    {!legal&&<ServiceHighlights onOpenBulk={()=>setBulkOpenRequest(value=>value+1)} />}<SiteFooter testCheckout={sections.testCheckout} demo={commerce.demoMode} cardKingdomPrices={sections.cardKingdomPrices} />
    {cartOpen && <div className="overlay"><aside className="drawer"><div className="drawer-head"><div><p className="eyebrow">{t("Your selection")}</p><h2>{t("Cart")}</h2></div><button className="close" type="button" onClick={() => setCartOpen(false)}>×</button></div><button className="text-button" type="button" disabled={commerce.disabled} onClick={() => { if (customer) void commerce.logout(); else { setCartOpen(false); setLoginOpen(true); } }}>{customer ? `${t("Log out")} ${customer}` : t("Log in to your account")}</button>{cart.length === 0 ? <p className="empty">{t("Your cart is empty. Add a card to begin.")}</p> : <><div className="cart-lines">{cart.map(item => <CartLineView key={item.id} item={item} price={price} disabled={commerce.disabled} availableStock={item.stock ?? cards.find(card => card.id === item.id)?.stock ?? knownStock.current.get(item.id) ?? null} onQuantity={quantity} />)}</div>{commerce.error && <p role="alert">{commerce.error}</p>}{cartHasUnavailable(cart)&&<p className="checkout-note" role="status">{t("Some items are no longer available in the quantity you chose. Remove them or adjust the quantity; they are not counted in the subtotal.")}</p>}<div className="cart-total"><span>{t("Subtotal")}</span><strong>{price(total)}</strong></div><button className="checkout" type="button" disabled={!(sections.testCheckout||sections.webpay)||commerce.disabled||itemCount===0||cartHasUnavailable(cart)} onClick={()=>void startCheckout()}>{customer?t("Continue to checkout"):t("Create account to check out")}</button><p className="checkout-note">{(sections.testCheckout||sections.webpay)?(customer?(sections.webpay?t("Pay securely with Webpay: credit, debit and prepaid cards."):t("Test checkout: your order is saved as Not paid and no payment is taken.")):t("Create a free account to place your order. Your cart will be saved to it.")):t("Payments are not available right now.")}</p></>}</aside></div>}
    {loginOpen && <AuthDialog mode={register?"register":"login"} onMode={mode=>{setRegister(mode==="register");setAuthError("");}} checkoutPending={checkoutPending} demo={commerce.demoMode} busy={authBusy||commerce.busy} error={authError||commerce.error} onSubmit={values=>void submitAuth(values)} onClose={()=>{setLoginOpen(false);setCheckoutPending(false);setAuthError("");}} />}
  </main>;
}
