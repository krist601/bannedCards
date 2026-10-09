"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Cart, CheckoutContact, PlacedOrder, WebpayStart } from "@/domain/commerce";
import { cartTotal, purchasableQuantity } from "@/application/cart";
import { emptyCheckoutForm, toCheckoutContact, validateCheckoutForm, type CheckoutErrors, type CheckoutForm } from "@/application/checkout-form";
import { formatRut } from "@/application/rut";
import { isWebpayUrl } from "@/application/webpay";
import { CheckoutFailed, type StockProblem } from "@/adapters/medusa-repositories";
import { loadProfile } from "@/adapters/account-repository";
import { metropolitanComunas, regions } from "@/config/chile";
import { accountPath } from "@/config/site";
import { CardImage } from "./card-image";
import { PaymentBadge } from "./payment-badge";
import { useLocale } from "./locale-provider";

const text = {
  es: {
    title: "Finalizar compra", steps: ["Carrito", "Entrega y documento", "Confirmación"], back: "← Seguir comprando",
    contact: "Contacto", contactHint: "Te enviaremos el resumen y el seguimiento a este correo.", email: "Correo de tu cuenta", phone: "Teléfono",
    delivery: "Entrega", name: "Nombre", lastName: "Apellidos", country: "País / Región", region: "Región", selectRegion: "Selecciona tu región", comuna: "Comuna", address: "Dirección de la calle", address2: "Departamento, casa, oficina (opcional)", branch: "Sucursal Starken (opcional)", branchHint: "Si prefieres retirar en una sucursal, escribe cuál.",
    shipping: "Starken · envío por pagar", shippingText: "Despachamos a todo Chile con Starken. El costo del envío lo pagas al recibir tu pedido.",
    document: "Documento tributario", documentHint: "Elige el documento que necesitas para esta compra.", boleta: "Boleta", boletaText: "Para personas", factura: "Factura", facturaText: "Para empresas",
    rut: "RUT", rutHint: "Ej: 12.345.678-5", companyRut: "RUT de la empresa", companyName: "Razón social", companyActivity: "Giro", companyAddress: "Dirección de la empresa", companyComuna: "Comuna de la empresa",
    notes: "Notas del pedido (opcional)", notesHint: "Indicaciones para la entrega, sucursal, etc.",
    test: "Modo de prueba: tu pedido se guardará como “No pagado” y no se realizará ningún cobro. El stock queda reservado para ti.",
    confirm: "Confirmar pedido", placing: "Confirmando tu pedido…", summary: "Tu pedido", items: ["producto", "productos"], subtotal: "Subtotal", shippingLine: "Envío", byPay: "Por pagar (Starken)", total: "Total", vat: "Precios en pesos chilenos (CLP).", includesVat: "Incluye", vatWord: "IVA",
    trust: ["Stock real, reservado para ti", "Despacho a todo Chile con Starken", "Condición indicada en cada carta"],
    required: "Este dato es obligatorio.", badPhone: "Ingresa un teléfono válido.", badRut: "El RUT no es válido. Revisa el número y el dígito verificador.", fixErrors: "Revisa los campos marcados para continuar.",
    stockRanOut: "Algunos productos se agotaron mientras comprabas. Tu pedido no fue realizado.", youAsked: "pediste", only: "quedan", none: "agotado", failed: "No se pudo realizar el pedido. No se hizo ningún cobro.",
    payment: "Método de pago", paymentHint: "Elige cómo quieres pagar.", webpay: "Webpay", webpayText: "Tarjetas de crédito, débito y prepago", webpaySafe: "Pagas en el sitio seguro de Transbank. Nosotros no guardamos los datos de tu tarjeta.", testMethod: "Pedido de prueba", testMethodText: "Sin cobro: el pedido queda como “No pagado”",
    payWebpay: "Pagar con Webpay", redirecting: "Redirigiendo a Webpay…", webpayNote: "Te llevaremos a Webpay para pagar. Reservamos tu stock por 30 minutos.", noPayments: "Los pagos están desactivados por ahora. Vuelve pronto.",
    needLogin: "Inicia sesión para finalizar tu compra", needLoginText: "Crea una cuenta gratis o ingresa a la tuya. Tu carrito se guarda en ella.", login: "Iniciar sesión o crear cuenta",
    empty: "Tu carrito está vacío", emptyText: "Agrega productos para poder finalizar tu compra.", shop: "Ver cartas sueltas",
    loading: "Cargando tu carrito…",
    placed: "Pedido recibido", thanks: "¡Gracias por tu compra!", orderNo: "Pedido", emailOk: "Te enviamos un correo con el resumen de tu compra.", emailFail: "No pudimos enviar el correo de resumen, pero tu pedido quedó guardado en tu perfil.", testDone: "Este es un pedido de prueba: no se realizó ningún cobro.",
    next: "¿Qué sigue?", nextText: ["Revisamos tu pedido y confirmamos stock.", "Preparamos tus productos.", "Despachamos con Starken a todo Chile."], viewOrder: "Ver mi pedido", keepShopping: "Seguir comprando", qty: "Cant.", each: "c/u",
    deliverTo: "Entregar a", documentLabel: "Documento",
  },
  en: {
    title: "Checkout", steps: ["Cart", "Delivery and document", "Confirmation"], back: "← Keep shopping",
    contact: "Contact", contactHint: "We'll send the summary and tracking to this email.", email: "Your account email", phone: "Phone",
    delivery: "Delivery", name: "First name", lastName: "Last name", country: "Country / Region", region: "Region", selectRegion: "Select your region", comuna: "Comuna", address: "Street address", address2: "Apartment, house, office (optional)", branch: "Starken branch (optional)", branchHint: "If you prefer to pick up at a branch, write which one.",
    shipping: "Starken · pay on delivery", shippingText: "We ship across Chile with Starken. You pay the shipping cost when you receive your order.",
    document: "Tax document", documentHint: "Choose the document you need for this purchase.", boleta: "Receipt (boleta)", boletaText: "For individuals", factura: "Invoice (factura)", facturaText: "For companies",
    rut: "RUT", rutHint: "E.g. 12.345.678-5", companyRut: "Company RUT", companyName: "Company name", companyActivity: "Business activity", companyAddress: "Company address", companyComuna: "Company comuna",
    notes: "Order notes (optional)", notesHint: "Delivery instructions, branch, etc.",
    test: "Test mode: your order will be saved as “Not paid” and no payment will be taken. Stock is reserved for you.",
    confirm: "Place order", placing: "Placing your order…", summary: "Your order", items: ["item", "items"], subtotal: "Subtotal", shippingLine: "Shipping", byPay: "Pay on delivery (Starken)", total: "Total", vat: "Prices in Chilean pesos (CLP).", includesVat: "Includes", vatWord: "VAT",
    trust: ["Real stock, reserved for you", "Shipping across Chile with Starken", "Condition shown on every card"],
    required: "This field is required.", badPhone: "Enter a valid phone number.", badRut: "The RUT is not valid. Check the number and check digit.", fixErrors: "Check the highlighted fields to continue.",
    stockRanOut: "Some products ran out while you were checking out. Your order was not placed.", youAsked: "you asked for", only: "left", none: "sold out", failed: "The order could not be placed. Nothing was charged.",
    payment: "Payment method", paymentHint: "Choose how you want to pay.", webpay: "Webpay", webpayText: "Credit, debit and prepaid cards", webpaySafe: "You pay on Transbank's secure site. We never store your card details.", testMethod: "Test order", testMethodText: "No charge: the order is saved as “Not paid”",
    payWebpay: "Pay with Webpay", redirecting: "Redirecting to Webpay…", webpayNote: "We'll take you to Webpay to pay. Your stock is reserved for 30 minutes.", noPayments: "Payments are turned off for now. Please come back soon.",
    needLogin: "Sign in to complete your purchase", needLoginText: "Create a free account or sign in. Your cart is saved to it.", login: "Sign in or create account",
    empty: "Your cart is empty", emptyText: "Add products to be able to check out.", shop: "Browse singles",
    loading: "Loading your cart…",
    placed: "Order received", thanks: "Thank you for your order!", orderNo: "Order", emailOk: "We emailed you a summary of your purchase.", emailFail: "We could not send the summary email, but your order is saved in your profile.", testDone: "This is a test order: no payment was taken.",
    next: "What happens next?", nextText: ["We review your order and confirm stock.", "We prepare your items.", "We ship with Starken across Chile."], viewOrder: "View my order", keepShopping: "Keep shopping", qty: "Qty", each: "each",
    deliverTo: "Deliver to", documentLabel: "Document",
  },
} as const;

const SAVED_KEY = "bc-checkout-details";
const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const TruckIcon = () => <svg {...icon}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>;
const ReceiptIcon = () => <svg {...icon}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" /></svg>;
const UserIcon = () => <svg {...icon}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" /></svg>;
const NoteIcon = () => <svg {...icon}><path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h4" /></svg>;
/** Product picture for the order lines; items without one get a box icon instead of an empty square. */
const Thumb = ({ line, badge }: { line: Cart[number]; badge?: number }) => <div className={`co-thumb ${line.theme}`}>{line.imageUrl ? <CardImage item={line} compact /> : <span className="co-thumb-empty" aria-hidden="true">📦</span>}{badge ? <em>{badge}</em> : null}</div>;
const LockIcon = () => <svg {...icon}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

type Props = { cart: Cart; customer: string; loading: boolean; demo: boolean; payments: { webpay: boolean; test: boolean }; price(value: number): string; onLogin(): void; onSubmit(contact: CheckoutContact): Promise<PlacedOrder>; onWebpay(contact: CheckoutContact): Promise<WebpayStart> };

/** Sends the shopper to Webpay: the browser posts the token to Transbank, which shows its payment form. */
function goToWebpay({ url, token }: WebpayStart) {
  const form = document.createElement("form");
  form.method = "POST"; form.action = url;
  const input = document.createElement("input");
  input.type = "hidden"; input.name = "token_ws"; input.value = token;
  form.appendChild(input); document.body.appendChild(form); form.submit();
}

/** The full-page checkout: contact, delivery (Starken), tax document (boleta or factura), and an order summary with pictures. */
export function CheckoutPage({ cart, customer, loading, demo, payments, price, onLogin, onSubmit, onWebpay }: Props) {
  const { locale } = useLocale();
  const l = text[locale === "en" ? "en" : "es"];
  const [form, setForm] = useState<CheckoutForm>(emptyCheckoutForm);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [method, setMethod] = useState<"webpay" | "test">("webpay"), [redirecting, setRedirecting] = useState(false);
  const payBy: "webpay" | "test" | null = method === "webpay" && payments.webpay ? "webpay" : payments.test && (method === "test" || !payments.webpay) ? "test" : payments.webpay ? "webpay" : null;
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [problems, setProblems] = useState<StockProblem[]>([]);
  const [placed, setPlaced] = useState<{ order: PlacedOrder; lines: Cart; contact: CheckoutContact } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prefilled = useRef(false);
  const lines = useMemo(() => cart.filter(line => purchasableQuantity(line) > 0), [cart]);
  const total = cartTotal(cart);
  const count = lines.reduce((sum, line) => sum + purchasableQuantity(line), 0);

  // Prefill from the last order on this device and from the account (name, phone, email).
  useEffect(() => {
    if (!customer || demo || prefilled.current) return;
    prefilled.current = true;
    let saved: Partial<CheckoutForm> = {};
    try { saved = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "{}"); } catch { /* ignore */ }
    loadProfile().then(profile => {
      setEmail(profile.email);
      setForm(current => ({ ...current, ...saved, notes: "", name: saved.name || profile.first_name || current.name, lastName: saved.lastName || profile.last_name || current.lastName, phone: saved.phone || profile.phone || current.phone }));
    }).catch(() => setForm(current => ({ ...current, ...saved, notes: "" })));
  }, [customer, demo]);

  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => { setForm(current => ({ ...current, [key]: value })); if (errors[key]) setErrors(current => ({ ...current, [key]: undefined })); };
  const message = (code?: string) => code === "phone" ? l.badPhone : code === "rut" ? l.badRut : code ? l.required : "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const found = validateCheckoutForm(form);
    setErrors(found); setError(""); setProblems([]);
    if (Object.values(found).some(Boolean)) {
      setError(l.fixErrors);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!payBy) { setError(l.noPayments); return; }
    setBusy(true);
    const contact = toCheckoutContact(form);
    let leaving = false;
    try {
      if (payBy === "webpay") {
        const start = await onWebpay(contact);
        if (!isWebpayUrl(start.url) || !start.token) throw new Error(l.failed);
        try { window.localStorage.setItem(SAVED_KEY, JSON.stringify({ ...form, notes: "" })); } catch { /* storage may be blocked */ }
        leaving = true; setRedirecting(true); goToWebpay(start);
        return;
      }
      const order = await onSubmit(contact);
      try { window.localStorage.setItem(SAVED_KEY, JSON.stringify({ ...form, notes: "" })); } catch { /* storage may be blocked */ }
      setPlaced({ order, lines, contact });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (failure) {
      if (failure instanceof CheckoutFailed && failure.problems.length) { setProblems(failure.problems); setError(l.stockRanOut); }
      else setError(failure instanceof Error && failure.message ? failure.message : l.failed);
    } finally { if (!leaving) setBusy(false); }
  }

  const field = (key: keyof CheckoutForm, label: string, options: { type?: string; autoComplete?: string; inputMode?: "text" | "tel" | "numeric"; max?: number; wide?: boolean; list?: string; hint?: string; placeholder?: string; format?: (value: string) => string } = {}) => {
    const code = errors[key];
    const id = `co-${key}`;
    return <div className={`co-field${options.wide ? " co-wide" : ""}${code ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={options.type ?? "text"} autoComplete={options.autoComplete} inputMode={options.inputMode} maxLength={options.max ?? 120} list={options.list} placeholder={options.placeholder}
        value={form[key] as string} aria-invalid={code ? true : undefined} aria-describedby={code || options.hint ? `${id}-note` : undefined}
        onChange={event => set(key, (options.format ? options.format(event.target.value) : event.target.value) as never)} />
      {(code || options.hint) && <small id={`${id}-note`} className={code ? "co-error" : ""}>{code ? message(code) : options.hint}</small>}
    </div>;
  };

  const Steps = ({ current }: { current: 1 | 2 | 3 }) => <ol className="co-steps" aria-label={l.title}>{l.steps.map((label, index) => <li key={label} className={index + 1 < current ? "is-done" : index + 1 === current ? "is-current" : ""} aria-current={index + 1 === current ? "step" : undefined}><span>{index + 1 < current ? "✓" : index + 1}</span>{label}</li>)}</ol>;

  if (placed) {
    const { order, lines: boughtLines, contact } = placed;
    const doc = contact.document === "factura" ? `${l.factura} · ${contact.company?.rut}` : `${l.boleta} · ${contact.rut}`;
    return <main className="co co-done" id="checkout">
      <Steps current={3} />
      <section className="co-done-card" role="status">
        <div className="co-check" aria-hidden="true">✓</div>
        <p className="eyebrow">{l.placed}</p>
        <h1>{l.thanks}</h1>
        <p className="co-order-no">{l.orderNo} <b>#{order.displayId}</b> <PaymentBadge status={order.paymentStatus} /></p>
        <ul className="co-lines">{boughtLines.map(line => <li key={line.id}><Thumb line={line} /><div className="co-line-main"><strong>{line.name}</strong><small>{purchasableQuantity(line)} × {price(line.price)}</small></div><b>{price(line.price * purchasableQuantity(line))}</b></li>)}</ul>
        <p className="co-total"><span>{l.total}</span><strong>{price(order.total)}</strong></p>
        <div className="co-recap">
          <div><h3>{l.deliverTo}</h3><p>{contact.name} {contact.lastName}<br />{[contact.address, contact.address2].filter(Boolean).join(", ")}<br />{contact.city}, {contact.region}<br />{contact.phone}</p></div>
          <div><h3>{l.documentLabel}</h3><p>{doc}{contact.company ? <><br />{contact.company.name}</> : null}</p><p className="co-muted"><TruckIcon /> {l.shipping}</p></div>
        </div>
        <p className="co-note">{order.emailSent ? l.emailOk : l.emailFail}</p>
        <p className="co-note">{l.testDone}</p>
        <h3 className="co-next-title">{l.next}</h3>
        <ol className="co-next">{l.nextText.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
        <div className="co-done-actions"><Link className="checkout" href={`${accountPath}?tab=orders&order=${encodeURIComponent(order.id)}`}>{l.viewOrder} →</Link><Link className="co-secondary" href="/">{l.keepShopping}</Link></div>
      </section>
    </main>;
  }

  if (loading) return <main className="co"><p role="status" className="co-muted">{l.loading}</p></main>;
  if (!customer) return <main className="co"><Steps current={2} /><section className="co-gate"><UserIcon /><h1>{l.needLogin}</h1><p>{l.needLoginText}</p><button className="checkout" type="button" onClick={onLogin}>{l.login}</button></section></main>;
  if (!lines.length) return <main className="co"><Steps current={1} /><section className="co-gate"><h1>{l.empty}</h1><p>{l.emptyText}</p><Link className="checkout" href="/singles">{l.shop}</Link></section></main>;

  const factura = form.document === "factura";
  return <main className="co" id="checkout">
    <Link className="co-back" href="/">{l.back}</Link>
    <Steps current={2} />
    <h1 className="co-title">{l.title}</h1>
    <div className="co-grid">
      <form className="co-form" ref={formRef} onSubmit={submit} noValidate>
        {error && <div role="alert" className="co-alert"><p>{error}</p>{!!problems.length && <ul>{problems.map(problem => <li key={problem.variant_id}>{problem.title}: {l.youAsked} {problem.requested}, {problem.available > 0 ? `${problem.available} ${l.only}` : l.none}</li>)}</ul>}</div>}

        <section className="co-card" aria-labelledby="co-contact">
          <h2 id="co-contact"><UserIcon />{l.contact}</h2>
          <p className="co-hint">{l.contactHint}</p>
          <div className="co-fields">
            <div className="co-field"><label htmlFor="co-email">{l.email}</label><input id="co-email" type="email" value={email} readOnly disabled /></div>
            {field("phone", l.phone, { type: "tel", autoComplete: "tel", inputMode: "tel", max: 40, placeholder: "+56 9 1234 5678" })}
          </div>
        </section>

        <section className="co-card" aria-labelledby="co-delivery">
          <h2 id="co-delivery"><TruckIcon />{l.delivery}</h2>
          <div className="co-ship"><TruckIcon /><div><strong>{l.shipping}</strong><p>{l.shippingText}</p></div><span aria-hidden="true">✓</span></div>
          <div className="co-fields">
            {field("name", l.name, { autoComplete: "given-name", max: 80 })}
            {field("lastName", l.lastName, { autoComplete: "family-name", max: 80 })}
            <div className="co-field co-wide"><label htmlFor="co-country">{l.country}</label><input id="co-country" value="Chile" readOnly disabled /></div>
            {field("address", l.address, { autoComplete: "address-line1", max: 200, wide: true })}
            {field("address2", l.address2, { autoComplete: "address-line2", max: 120, wide: true })}
            <div className={`co-field${errors.region ? " has-error" : ""}`}>
              <label htmlFor="co-region">{l.region}</label>
              <select id="co-region" value={form.region} aria-invalid={errors.region ? true : undefined} autoComplete="address-level1" onChange={event => set("region", event.target.value)}>
                <option value="">{l.selectRegion}</option>{regions.map(region => <option key={region} value={region}>{region}</option>)}
              </select>
              {errors.region && <small className="co-error">{message(errors.region)}</small>}
            </div>
            {field("city", l.comuna, { autoComplete: "address-level2", max: 80, list: form.region === "Región Metropolitana de Santiago" ? "co-comunas" : undefined })}
            <datalist id="co-comunas">{metropolitanComunas.map(comuna => <option key={comuna} value={comuna} />)}</datalist>
            {field("branch", l.branch, { max: 120, wide: true, hint: l.branchHint })}
          </div>
        </section>

        <section className="co-card" aria-labelledby="co-doc">
          <h2 id="co-doc"><ReceiptIcon />{l.document}</h2>
          <p className="co-hint">{l.documentHint}</p>
          <div className="co-choice" role="radiogroup" aria-label={l.document}>
            {(["boleta", "factura"] as const).map(kind => <label key={kind} className={form.document === kind ? "is-selected" : ""}>
              <input type="radio" name="document" value={kind} checked={form.document === kind} onChange={() => { set("document", kind); setErrors({}); }} />
              <span><strong>{kind === "boleta" ? l.boleta : l.factura}</strong><small>{kind === "boleta" ? l.boletaText : l.facturaText}</small></span>
            </label>)}
          </div>
          <div className="co-fields">
            {!factura && field("rut", l.rut, { max: 12, inputMode: "text", autoComplete: "off", hint: l.rutHint, format: formatRut })}
            {factura && <>
              {field("companyRut", l.companyRut, { max: 12, autoComplete: "off", hint: l.rutHint, format: formatRut })}
              {field("companyName", l.companyName, { autoComplete: "organization", max: 160 })}
              {field("companyActivity", l.companyActivity, { max: 160, wide: true })}
              {field("companyAddress", l.companyAddress, { autoComplete: "off", max: 200, wide: true })}
              {field("companyComuna", l.companyComuna, { max: 80 })}
            </>}
          </div>
        </section>

        <section className="co-card" aria-labelledby="co-pay">
          <h2 id="co-pay"><LockIcon />{l.payment}</h2>
          {payBy ? <>
            <p className="co-hint">{l.paymentHint}</p>
            <div className="co-choice" role="radiogroup" aria-label={l.payment}>
              {payments.webpay && <label className={payBy === "webpay" ? "is-selected" : ""}><input type="radio" name="method" checked={payBy === "webpay"} onChange={() => setMethod("webpay")} /><span><strong>{l.webpay}</strong><small>{l.webpayText}</small></span></label>}
              {payments.test && <label className={payBy === "test" ? "is-selected" : ""}><input type="radio" name="method" checked={payBy === "test"} onChange={() => setMethod("test")} /><span><strong>{l.testMethod}</strong><small>{l.testMethodText}</small></span></label>}
            </div>
            {payBy === "webpay" && <p className="co-hint co-secure">🔒 {l.webpaySafe}</p>}
          </> : <p className="co-hint">{l.noPayments}</p>}
        </section>

        <section className="co-card" aria-labelledby="co-notes">
          <h2 id="co-notes"><NoteIcon />{l.notes}</h2>
          <div className="co-field"><textarea id="co-notes-text" rows={3} maxLength={500} placeholder={l.notesHint} value={form.notes} onChange={event => set("notes", event.target.value)} aria-label={l.notes} /></div>
        </section>

        {payBy === "test" && <p className="co-testnote"><LockIcon />{l.test}</p>}
        {payBy === "webpay" && <p className="co-testnote co-webpay-note"><LockIcon />{l.webpayNote}</p>}
        <button className="checkout co-submit" type="submit" disabled={busy || !payBy}>{redirecting ? l.redirecting : busy ? l.placing : payBy === "webpay" ? `${l.payWebpay} · ${price(total)}` : `${l.confirm} · ${price(total)}`}</button>
      </form>

      <aside className="co-summary" aria-label={l.summary}>
        <h2>{l.summary} <small>({count} {count === 1 ? l.items[0] : l.items[1]})</small></h2>
        <ul className="co-lines">{lines.map(line => <li key={line.id}>
          <Thumb line={line} badge={purchasableQuantity(line)} />
          <div className="co-line-main"><strong>{line.name}</strong><small>{[line.finish === "Standard" ? "" : line.finish, line.condition === "See listing" ? "" : line.condition, line.attributes?.language].filter(Boolean).join(" · ")}</small><small>{purchasableQuantity(line)} × {price(line.price)}</small></div>
          <b>{price(line.price * purchasableQuantity(line))}</b>
        </li>)}</ul>
        <dl className="co-totals">
          <div><dt>{l.subtotal}</dt><dd>{price(total)}</dd></div>
          <div><dt>{l.shippingLine}</dt><dd>{l.byPay}</dd></div>
          <div className="co-grand"><dt>{l.total}</dt><dd>{price(total)}</dd></div>
          <div className="co-vat"><dt /><dd>{l.includesVat} {price(Math.round(total * 19 / 119))} {l.vatWord}</dd></div>
        </dl>
        <p className="co-muted">{l.vat}</p>
        <ul className="co-trust">{l.trust.map(item => <li key={item}>✓ {item}</li>)}</ul>
      </aside>
    </div>
  </main>;
}
