"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GoogleButton } from "./google-button";
import { loadOrders, loadEmailVerification, sendEmailVerification, loadProfile, saveProfile, type AccountOrder, type Profile } from "@/adapters/account-repository";
import { accountPath } from "@/config/site";
import { useLocale } from "./locale-provider";
import { PaymentBadge } from "./checkout-dialog";

const text = {
  es: {
    eyebrow: "Mi cuenta", hello: "Hola", logout: "Cerrar sesión",
    tabs: { orders: "Mis pedidos", details: "Mis datos", security: "Seguridad" },
    stats: { orders: "Pedidos", unpaid: "Pago pendiente", total: "Total en pedidos", since: "Cliente desde" },
    verified: "Correo verificado", unverified: "Correo sin verificar",
    welcomeTitle: "¡Tu cuenta está lista!", welcomeBody: "Ya puedes comprar. Tu carrito quedó guardado en tu cuenta y la verás desde cualquier dispositivo.",
    verifyTitle: "Confirma tu correo", verifyBody: "Te enviamos un enlace a", resend: "Reenviar correo", sentAgain: "Te enviamos un nuevo enlace. Revisa tu bandeja de entrada y la carpeta de spam.", wait: "Espera un momento antes de volver a pedirlo.", already: "Tu correo ya está confirmado.", sendError: "No pudimos enviar el correo. Inténtalo de nuevo más tarde.",
    ordersTitle: "Historial de pedidos", ordersLead: "Revisa el estado y el pago de cada compra.",
    noOrders: "Todavía no tienes pedidos", noOrdersHint: "Cuando compres, tus pedidos aparecerán aquí con su estado de pago.", startShopping: "Ir a la tienda",
    order: "Pedido", more: "Ver más pedidos", loading: "Cargando…", ordersError: "No pudimos cargar tus pedidos.", retry: "Reintentar", unpaidNote: "Este pedido está pendiente de pago.",
    status: { pending: "En proceso", completed: "Completado", canceled: "Cancelado", requires_action: "Requiere acción", archived: "Archivado" } as Record<string, string>, total: "Total",
    detailsTitle: "Mis datos", detailsLead: "Mantén tu información al día para que tus pedidos lleguen sin problemas.",
    firstName: "Nombre", lastName: "Apellido", phone: "Teléfono", email: "Correo electrónico", emailHint: "Para cambiar tu correo escríbenos y lo hacemos por ti.", save: "Guardar cambios", saving: "Guardando…", saved: "Cambios guardados.", saveError: "No pudimos guardar tus datos. Inténtalo de nuevo.",
    securityTitle: "Seguridad", securityLead: "Protege tu cuenta y entra más rápido.", emailStatus: "Verificación del correo", confirmed: "Tu correo está confirmado.",
    google: "Inicio de sesión con Google", googleHint: "Vincula tu cuenta de Google con el mismo correo para entrar con un clic.",
    cartNote: "Tu carrito se guarda automáticamente en tu cuenta.",
    guestTitle: "Inicia sesión para ver tu cuenta", guestBody: "Aquí verás tus pedidos, tus datos y la seguridad de tu cuenta.", login: "Iniciar sesión o crear cuenta", loadingAccount: "Cargando tu cuenta…",
  },
  en: {
    eyebrow: "My account", hello: "Hi", logout: "Log out",
    tabs: { orders: "My orders", details: "My details", security: "Security" },
    stats: { orders: "Orders", unpaid: "Payment pending", total: "Total in orders", since: "Customer since" },
    verified: "Email verified", unverified: "Email not verified",
    welcomeTitle: "Your account is ready!", welcomeBody: "You can shop now. Your cart is saved to your account and available from any device.",
    verifyTitle: "Confirm your email", verifyBody: "We sent a link to", resend: "Resend email", sentAgain: "We sent you a new link. Check your inbox and spam folder.", wait: "Please wait a moment before asking again.", already: "Your email is already confirmed.", sendError: "The email could not be sent. Please try again later.",
    ordersTitle: "Order history", ordersLead: "Check the status and payment of every purchase.",
    noOrders: "You have no orders yet", noOrdersHint: "When you buy, your orders will show up here with their payment status.", startShopping: "Go to the store",
    order: "Order", more: "Show more orders", loading: "Loading…", ordersError: "We could not load your orders.", retry: "Retry", unpaidNote: "This order is waiting for payment.",
    status: { pending: "Processing", completed: "Completed", canceled: "Canceled", requires_action: "Action required", archived: "Archived" } as Record<string, string>, total: "Total",
    detailsTitle: "My details", detailsLead: "Keep your information up to date so your orders arrive without trouble.",
    firstName: "First name", lastName: "Last name", phone: "Phone", email: "Email address", emailHint: "To change your email, write to us and we will do it for you.", save: "Save changes", saving: "Saving…", saved: "Changes saved.", saveError: "We could not save your details. Please try again.",
    securityTitle: "Security", securityLead: "Protect your account and sign in faster.", emailStatus: "Email verification", confirmed: "Your email is confirmed.",
    google: "Sign in with Google", googleHint: "Link your Google account with the same email to sign in with one click.",
    cartNote: "Your cart is saved automatically to your account.",
    guestTitle: "Sign in to see your account", guestBody: "Here you will find your orders, your details and your account security.", login: "Log in or create an account", loadingAccount: "Loading your account…",
  },
} as const;
type Strings = (typeof text)["es"] | (typeof text)["en"];
type Tab = "orders" | "details" | "security";
const tabKeys: Tab[] = ["orders", "details", "security"];
const initials = (value: string) => value.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join("") || "?";

const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const icons: Record<Tab, React.ReactElement> = {
  orders: <svg {...svg}><path d="M6 3h12l2 5H4z" /><path d="M5 8v12h14V8" /><path d="M9 12h6" /></svg>,
  details: <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  security: <svg {...svg}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
};

function VerifyBanner({ l, email, welcome }: { l: Strings; email: string; welcome: boolean }) {
  const { locale } = useLocale();
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true); setMessage("");
    try { const r = await sendEmailVerification(locale); setMessage(r.verified ? l.already : r.sent ? l.sentAgain : `${l.wait}${r.retryAfter ? ` (${r.retryAfter}s)` : ""}`); } catch { setMessage(l.sendError); } finally { setBusy(false); }
  }
  return <div className="acctp-banner acctp-banner-warn" role="status">
    <span className="acctp-banner-icon" aria-hidden="true">✉</span>
    <div><strong>{l.verifyTitle}</strong><p>{l.verifyBody} <b>{email}</b>.{welcome ? "" : ""}</p>{message && <p className="acctp-banner-msg">{message}</p>}</div>
    <button type="button" className="acctp-btn" disabled={busy} onClick={() => void resend()}>{l.resend}</button>
  </div>;
}

function Details({ l, onSaved }: { l: Strings; onSaved(profile: Profile): void }) {
  const [profile, setProfile] = useState<Profile | null>(null), [form, setForm] = useState({ first_name: "", last_name: "", phone: "" }), [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  useEffect(() => { let active = true; loadProfile().then(value => { if (!active) return; setProfile(value); setForm({ first_name: value.first_name, last_name: value.last_name, phone: value.phone }); }).catch(() => { if (active) setStatus("error"); }); return () => { active = false; }; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setStatus("saving");
    try { const saved = await saveProfile(form); setProfile(saved); onSaved(saved); setStatus("saved"); } catch { setStatus("error"); }
  }
  const field = (name: keyof typeof form, value: string) => { setForm(current => ({ ...current, [name]: value })); setStatus(""); };
  return <form className="acctp-form" onSubmit={submit}>
    <label>{l.firstName}<input value={form.first_name} onChange={e => field("first_name", e.target.value)} autoComplete="given-name" maxLength={100} /></label>
    <label>{l.lastName}<input value={form.last_name} onChange={e => field("last_name", e.target.value)} autoComplete="family-name" maxLength={100} /></label>
    <label>{l.phone}<input value={form.phone} onChange={e => field("phone", e.target.value)} autoComplete="tel" inputMode="tel" maxLength={40} /></label>
    <label>{l.email}<input value={profile?.email ?? ""} readOnly disabled /><small>{l.emailHint}</small></label>
    <div className="acctp-actions"><button className="acctp-btn acctp-btn-solid" type="submit" disabled={!profile || status === "saving"}>{status === "saving" ? l.saving : l.save}</button>
      {status === "saved" && <span role="status" className="acctp-ok">✓ {l.saved}</span>}{status === "error" && <span role="alert" className="acctp-error">{l.saveError}</span>}</div>
  </form>;
}

function Security({ l, verified, email, onVerified }: { l: Strings; verified: boolean | null; email: string; onVerified(): void }) {
  const { locale } = useLocale();
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true); setMessage("");
    try { const r = await sendEmailVerification(locale); setMessage(r.verified ? l.already : r.sent ? l.sentAgain : `${l.wait}${r.retryAfter ? ` (${r.retryAfter}s)` : ""}`); if (r.verified) onVerified(); } catch { setMessage(l.sendError); } finally { setBusy(false); }
  }
  return <div className="acctp-stack">
    <div className="acctp-row">
      <div><strong>{l.emailStatus}</strong>{verified === null ? <p className="muted">{l.loading}</p> : verified ? <p className="acctp-ok">✓ {l.confirmed}</p> : <p>{l.verifyBody} <b>{email}</b>.</p>}{message && <p className="acctp-hint">{message}</p>}</div>
      {verified === false && <button type="button" className="acctp-btn" disabled={busy} onClick={() => void resend()}>{l.resend}</button>}
    </div>
    <div className="acctp-row"><div><strong>{l.google}</strong><p className="acctp-hint">{l.googleHint}</p></div><GoogleButton link /></div>
  </div>;
}

export function AccountPage({ customer, loading, demo, onLogin, onLogout, onNameChange }: { customer: string; loading: boolean; demo: boolean; onLogin(): void; onLogout(): void; onNameChange(name: string): void }) {
  const { locale } = useLocale();
  const l = text[locale === "en" ? "en" : "es"];
  const router = useRouter(), params = useSearchParams();
  const tab: Tab = tabKeys.includes(params.get("tab") as Tab) ? (params.get("tab") as Tab) : "orders";
  const welcome = params.get("welcome") === "1";
  const [orders, setOrders] = useState<AccountOrder[]>([]), [count, setCount] = useState(0), [ordersLoading, setOrdersLoading] = useState(true), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null), [verified, setVerified] = useState<boolean | null>(null);
  const signedIn = Boolean(customer);
  useEffect(() => {
    if (!signedIn || demo) return;
    let active = true;
    loadProfile().then(value => { if (active) setProfile(value); }).catch(() => {});
    loadEmailVerification().then(value => { if (active) setVerified(value.verified); }).catch(() => {});
    return () => { active = false; };
  }, [signedIn, demo]);
  const fetchPage = useCallback(async (offset: number) => (demo ? { orders: [] as AccountOrder[], count: 0 } : loadOrders(offset)), [demo]);
  useEffect(() => {
    if (!signedIn) return;
    let active = true; setOrdersLoading(true); setError(false);
    fetchPage(0).then(data => { if (active) { setOrders(data.orders); setCount(data.count); } }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, [fetchPage, attempt, signedIn]);
  async function loadMore() {
    setOrdersLoading(true);
    try { const data = await fetchPage(orders.length); setOrders(current => [...current, ...data.orders]); setCount(data.count); } catch { setError(true); } finally { setOrdersLoading(false); }
  }
  const go = (next: Tab) => router.replace(`${accountPath}?tab=${next}`, { scroll: false });
  const money = (value: number, currency: string) => new Intl.NumberFormat(locale === "es" ? "es-CL" : "en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(value);
  const date = (value: string) => new Date(value).toLocaleDateString(locale === "es" ? "es-CL" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  if (!signedIn) return <section className="acctp-guest">
    <div className="acctp-guest-card">
      <span className="acctp-avatar" aria-hidden="true">?</span>
      {loading ? <h1>{l.loadingAccount}</h1> : <><h1>{l.guestTitle}</h1><p>{l.guestBody}</p><button className="acctp-btn acctp-btn-solid" type="button" onClick={onLogin}>{l.login}</button></>}
    </div>
  </section>;

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || customer;
  const firstName = profile?.first_name || customer.split(" ")[0];
  const unpaid = orders.filter(order => order.status === "pending" && order.metadata?.payment_status === "not_paid").length;
  const totalSpent = orders.filter(order => order.status !== "canceled").reduce((sum, order) => sum + order.total, 0);
  const currency = orders[0]?.currency_code ?? "clp";
  const stats = [
    { label: l.stats.orders, value: String(count) },
    { label: l.stats.unpaid, value: String(unpaid), warn: unpaid > 0 },
    { label: l.stats.total, value: orders.length ? money(totalSpent, currency) : "—" },
    { label: l.stats.since, value: profile?.created_at ? String(new Date(profile.created_at).getFullYear()) : "—" },
  ];
  const titles: Record<Tab, [string, string]> = { orders: [l.ordersTitle, l.ordersLead], details: [l.detailsTitle, l.detailsLead], security: [l.securityTitle, l.securityLead] };

  return <div className="acctp">
    <section className="acctp-hero">
      <div className="acctp-hero-inner">
        <span className="acctp-avatar" aria-hidden="true">{initials(displayName)}</span>
        <div className="acctp-who">
          <p className="acctp-eyebrow">{l.eyebrow}</p>
          <h1>{l.hello}, {firstName}</h1>
          {profile && <p className="acctp-email">{profile.email}</p>}
          {verified !== null && <span className={`acctp-verify ${verified ? "acctp-verify-ok" : "acctp-verify-pending"}`}>{verified ? `✓ ${l.verified}` : l.unverified}</span>}
        </div>
        <button className="acctp-btn acctp-btn-ghost" type="button" onClick={onLogout}>{l.logout}</button>
      </div>
    </section>
    <div className="acctp-wrap">
      <div className="acctp-stats">{stats.map(stat => <div key={stat.label}><strong className={stat.warn ? "acctp-warn" : ""}>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      {welcome && <div className="acctp-banner acctp-banner-ok" role="status"><span className="acctp-banner-icon" aria-hidden="true">✓</span><div><strong>{l.welcomeTitle}</strong><p>{l.welcomeBody}</p></div><Link className="acctp-btn" href="/">{l.startShopping}</Link></div>}
      {verified === false && profile && <VerifyBanner l={l} email={profile.email} welcome={welcome} />}
      <div className="acctp-grid">
        <nav className="acctp-nav" aria-label={l.eyebrow}>
          {tabKeys.map(key => <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => go(key)}>{icons[key]}<span>{l.tabs[key]}</span></button>)}
          <p className="acctp-cartnote">{l.cartNote}</p>
        </nav>
        <main className="acctp-content">
          <header><h2>{titles[tab][0]}</h2><p>{titles[tab][1]}</p></header>
          {tab === "orders" && (ordersLoading && !orders.length ? <p role="status" className="muted">{l.loading}</p> : error && !orders.length ? <p role="alert">{l.ordersError} <button type="button" className="text-button" onClick={() => setAttempt(v => v + 1)}>{l.retry}</button></p> :
            !orders.length ? <div className="acctp-empty"><span aria-hidden="true">🛍️</span><h3>{l.noOrders}</h3><p>{l.noOrdersHint}</p><Link className="acctp-btn acctp-btn-solid" href="/">{l.startShopping}</Link></div> :
            <div className="acctp-orders">{orders.map(order => <article className="acctp-order" key={order.id}>
              <div className="acctp-order-head">
                <div><strong>{l.order} #{order.display_id}</strong><span>{date(order.created_at)}</span></div>
                <div className="acctp-chips">
                  <span className={`acctp-status acctp-status-${order.status}`}>{l.status[order.status] ?? order.status}</span>
                  {order.metadata?.payment_status && order.status !== "canceled" && <PaymentBadge status={order.metadata.payment_status === "paid" ? "paid" : "not_paid"} />}
                </div>
              </div>
              <ul className="acctp-items">{order.items?.map(item => <li key={item.id}>
                {item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : <span className="acctp-thumb" aria-hidden="true" />}
                <span className="acctp-item-name">{item.title}<small>{item.quantity} × {typeof item.unit_price === "number" ? money(item.unit_price, order.currency_code) : ""}</small></span>
                {typeof item.unit_price === "number" && <b>{money(item.unit_price * item.quantity, order.currency_code)}</b>}
              </li>)}</ul>
              <div className="acctp-order-foot">
                {order.metadata?.payment_status === "not_paid" && order.status === "pending" ? <span className="acctp-hint">{l.unpaidNote}</span> : <span />}
                <div><span>{l.total}</span><strong>{money(order.total, order.currency_code)}</strong></div>
              </div>
            </article>)}
              {orders.length < count && <button type="button" className="acctp-btn" disabled={ordersLoading} onClick={() => void loadMore()}>{ordersLoading ? l.loading : l.more}</button>}</div>)}
          {tab === "details" && (demo ? <p className="muted">{customer}</p> : <Details l={l} onSaved={saved => { setProfile(saved); onNameChange(saved.first_name || saved.email); }} />)}
          {tab === "security" && (demo ? <p className="muted">{l.cartNote}</p> : <Security l={l} verified={verified} email={profile?.email ?? ""} onVerified={() => setVerified(true)} />)}
        </main>
      </div>
    </div>
  </div>;
}
