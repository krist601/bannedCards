"use client";

import { useEffect, useMemo, useState } from "react";
import { browserCartRepository, browserCustomerSession } from "@/adapters/browser-repositories";
import { demoCatalogueRepository } from "@/adapters/demo-catalogue-repository";
import { addToCart, cartItemCount, cartTotal, setCartQuantity } from "@/application/cart";
import type { Cart, CatalogueItem, Collection } from "@/domain/commerce";

const cards = demoCatalogueRepository.list();

const price = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Home() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<Collection>("All");
  const [cart, setCart] = useState<Cart>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState("");

  useEffect(() => {
    setCart(browserCartRepository.load());
    setCustomer(browserCustomerSession.load());
  }, []);
  useEffect(() => browserCartRepository.save(cart), [cart]);

  const results = useMemo(() => cards.filter((card) => (`${card.name} ${card.set}`).toLowerCase().includes(query.toLowerCase()) && (collection === "All" || card.collection === collection)), [collection, query]);
  const itemCount = cartItemCount(cart);
  const total = cartTotal(cart);

  function add(card: CatalogueItem) {
    setCart((items) => addToCart(items, card));
    setCartOpen(true);
  }
  function quantity(id: string, next: number) { setCart((items) => setCartQuantity(items, id, next)); }
  function login(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const name = email.split("@")[0].replace(/[._-]/g, " "); const displayName = name.charAt(0).toUpperCase() + name.slice(1); setCustomer(displayName); browserCustomerSession.save(displayName); setLoginOpen(false); }

  return <main>
    <header className="site-header"><a className="brand" href="#top">BANNED <span>CARDS</span></a><nav><a href="#singles">Singles</a><a href="#sets">Expansions</a><a href="#about">About</a></nav><div className="header-actions"><button className="text-button" type="button" onClick={() => { if (customer) { browserCustomerSession.clear(); setCustomer(""); } else setLoginOpen(true); }}>{customer ? `Hi, ${customer}` : "Log in"}</button><button className="cart" type="button" onClick={() => setCartOpen(true)}>Cart <b>{itemCount}</b></button></div></header>
    <section id="top" className="hero"><p className="eyebrow">Magic: The Gathering · Chile</p><h1>Find the next card<br />for your deck.</h1><p className="hero-copy">Singles from the newest Magic releases and the journey through Middle-earth. Every listing is the exact card you will receive.</p><a className="button" href="#singles">Browse singles</a></section>
    <section id="sets" className="sets"><p className="eyebrow">Explore collections</p><h2>What&apos;s in the vault</h2><div className="set-grid"><button className={`set-card ${collection === "Latest" ? "is-active" : ""}`} type="button" onClick={() => setCollection("Latest")}><span>2026</span><strong>Latest releases</strong><small>Lorwyn Eclipsed · Secrets of Strixhaven · Marvel Super Heroes</small></button><button className={`set-card middle-earth ${collection === "Middle-earth" ? "is-active" : ""}`} type="button" onClick={() => setCollection("Middle-earth")}><span>LTR</span><strong>Middle-earth</strong><small>The Lord of the Rings: Tales of Middle-earth</small></button><button className={`set-card all-sets ${collection === "All" ? "is-active" : ""}`} type="button" onClick={() => setCollection("All")}><span>ALL</span><strong>All singles</strong><small>See every card in the current demo inventory</small></button></div></section>
    <section id="singles" className="catalogue"><div className="section-head"><div><p className="eyebrow">In-stock inventory</p><h2>Magic singles</h2></div><span>{results.length} cards found</span></div><div className="search-row"><label htmlFor="card-search" className="sr-only">Search cards</label><input id="card-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by card or expansion…" /><button type="button" onClick={() => { setQuery(""); setCollection("All"); }}>Clear</button></div><div className="catalogue-layout"><aside className="filters"><strong>Collections</strong><button type="button" className={collection === "All" ? "filter-active" : ""} onClick={() => setCollection("All")}>All singles</button><button type="button" className={collection === "Latest" ? "filter-active" : ""} onClick={() => setCollection("Latest")}>Latest releases</button><button type="button" className={collection === "Middle-earth" ? "filter-active" : ""} onClick={() => setCollection("Middle-earth")}>Middle-earth / Hobbit</button><p>Condition, language, finish, photos, and live stock will come from Medusa once the backend is connected.</p></aside><div className="card-grid">{results.map((card) => <article className="product" key={card.id}><div className={`card-art ${card.theme}`}><span>{card.colors}</span><em>{card.set}</em></div><div className="product-details"><p className="set">{card.set}</p><h3>{card.name}</h3><p className="variant">{card.finish} · {card.condition}</p><div className="product-footer"><strong>{price(card.price)}</strong><button type="button" onClick={() => add(card)}>Add</button></div><small>{card.stock} in stock</small></div></article>)}</div></div></section>
    <section className="promises"><div><span>01</span><h2>Honest grading</h2><p>Every card is checked against our condition guide before it is listed.</p></div><div><span>02</span><h2>Real inventory</h2><p>Your cards are reserved only after a confirmed Mercado Pago payment.</p></div><div><span>03</span><h2>Built to expand</h2><p>The catalogue model supports Magic today and new TCGs tomorrow.</p></div></section><footer id="about"><a className="brand" href="#top">BANNED <span>CARDS</span></a><p>Demo storefront · prices and stock are illustrative.</p></footer>
    {cartOpen && <div className="overlay"><aside className="drawer"><div className="drawer-head"><div><p className="eyebrow">Your selection</p><h2>Cart</h2></div><button className="close" type="button" onClick={() => setCartOpen(false)}>×</button></div>{cart.length === 0 ? <p className="empty">Your cart is empty. Add a card to begin.</p> : <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><div className={`cart-mini ${item.theme}`}>{item.colors}</div><div><strong>{item.name}</strong><small>{item.finish} · {item.condition}</small><span>{price(item.price)}</span></div><div className="quantity"><button type="button" onClick={() => quantity(item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button type="button" onClick={() => quantity(item.id, item.quantity + 1)}>+</button></div></div>)}</div><div className="cart-total"><span>Subtotal</span><strong>{price(total)}</strong></div><button className="checkout" type="button" onClick={() => window.alert("Mercado Pago checkout will be connected after the Medusa payment provider is configured.")}>Continue to checkout</button><p className="checkout-note">Secure Mercado Pago checkout is the next payment milestone.</p></>}</aside></div>}
    {loginOpen && <div className="overlay modal-wrap"><form className="login-modal" onSubmit={login}><button className="close modal-close" type="button" onClick={() => setLoginOpen(false)}>×</button><p className="eyebrow">Demo account</p><h2>Welcome back</h2><p>Sign in locally to preview the customer experience. Medusa customer accounts will replace this demo login.</p><label htmlFor="email">Email address</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button className="checkout" type="submit">Continue</button></form></div>}
  </main>;
}
