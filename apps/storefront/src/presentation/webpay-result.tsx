"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { WebpayOutcome } from "@/domain/commerce";
import { fetchWebpayOutcome } from "@/adapters/webpay-repository";
import { hasWebpayReturn, readWebpayReturn } from "@/application/webpay";
import { accountPath, checkoutPath } from "@/config/site";
import { PaymentBadge } from "./payment-badge";
import { SkeletonImage } from "./skeleton-image";
import { useLocale } from "./locale-provider";

const text = {
  es: {
    steps: ["Carrito", "Entrega y documento", "Pago"], loading: "Confirmando tu pago con Webpay…", loadingHint: "No cierres esta página, solo toma unos segundos.",
    approved: "Pago aprobado", thanks: "¡Gracias por tu compra!", orderNo: "Pedido", total: "Total", paidWith: "Pagado con Webpay", card: "Tarjeta", auth: "Autorización", installments: "cuotas", noInstallments: "sin cuotas",
    deliverTo: "Entregar a", documentLabel: "Documento", boleta: "Boleta", factura: "Factura", shipping: "Starken · envío por pagar",
    emailOk: "Te enviamos un correo con el resumen de tu compra.", emailFail: "No pudimos enviar el correo de resumen, pero tu pedido quedó guardado en tu perfil.",
    testPayment: "Este fue un pago de prueba en el ambiente de integración de Transbank: no se realizó ningún cobro real.",
    next: "¿Qué sigue?", nextText: ["Revisamos tu pedido y confirmamos stock.", "Preparamos tus productos.", "Despachamos con Starken a todo Chile."], viewOrder: "Ver mi pedido", keepShopping: "Seguir comprando",
    rejectedTitle: "Tu pago no fue aprobado", rejectedText: "Webpay no aprobó el pago. No se realizó ningún cobro y tu carrito sigue guardado, puedes intentarlo de nuevo con otra tarjeta.",
    abortedTitle: "Cancelaste el pago", abortedText: "No se realizó ningún cobro y tu carrito sigue guardado. Cuando quieras, puedes volver a intentarlo.",
    reviewTitle: "Recibimos tu pago, pero necesitamos revisarlo", reviewText: "El monto pagado no coincide con tu pedido. No te preocupes: te contactaremos pronto. Si necesitas ayuda, escríbenos a",
    unknownTitle: "No encontramos este pago", unknownText: "Puede que el enlace haya vencido o que ya lo hayas usado. Revisa tus pedidos en tu cuenta.", errorTitle: "No pudimos confirmar tu pago todavía", errorText: "Tu pago no se perdió. Recarga esta página en unos segundos para ver el resultado.", reload: "Recargar", retry: "Volver a intentarlo", myOrders: "Mis pedidos",
  },
  en: {
    steps: ["Cart", "Delivery and document", "Payment"], loading: "Confirming your payment with Webpay…", loadingHint: "Please don't close this page, it only takes a few seconds.",
    approved: "Payment approved", thanks: "Thank you for your purchase!", orderNo: "Order", total: "Total", paidWith: "Paid with Webpay", card: "Card", auth: "Authorization", installments: "installments", noInstallments: "no installments",
    deliverTo: "Deliver to", documentLabel: "Document", boleta: "Receipt (boleta)", factura: "Invoice (factura)", shipping: "Starken · pay on delivery",
    emailOk: "We emailed you a summary of your purchase.", emailFail: "We could not send the summary email, but your order is saved in your profile.",
    testPayment: "This was a test payment in Transbank's integration environment: no real charge was made.",
    next: "What happens next?", nextText: ["We review your order and confirm stock.", "We prepare your items.", "We ship with Starken across Chile."], viewOrder: "View my order", keepShopping: "Keep shopping",
    rejectedTitle: "Your payment was not approved", rejectedText: "Webpay did not approve the payment. Nothing was charged and your cart is still saved, so you can try again with another card.",
    abortedTitle: "You cancelled the payment", abortedText: "Nothing was charged and your cart is still saved. You can try again whenever you like.",
    reviewTitle: "We received your payment, but we need to review it", reviewText: "The amount paid does not match your order. Don't worry: we'll contact you soon. If you need help, write to",
    unknownTitle: "We could not find this payment", unknownText: "The link may have expired or may already have been used. Check your orders in your account.", errorTitle: "We could not confirm your payment yet", errorText: "Your payment was not lost. Reload this page in a few seconds to see the result.", reload: "Reload", retry: "Try again", myOrders: "My orders",
  },
} as const;

type State = { phase: "loading" } | { phase: "error" } | { phase: "done"; outcome: WebpayOutcome };

/** Where Webpay sends the shopper back: asks the store to confirm the payment and shows the result. */
export function WebpayResult({ price, onApproved }: { price(value: number): string; onApproved(): void }) {
  const { locale } = useLocale();
  const l = text[locale === "en" ? "en" : "es"];
  const [state, setState] = useState<State>({ phase: "loading" });
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const params = readWebpayReturn(window.location.search);
    if (!hasWebpayReturn(params)) { setState({ phase: "done", outcome: { status: "unknown" } }); return; }
    if (started.current && attempt === 0) return;
    started.current = true;
    let active = true;
    fetchWebpayOutcome(params).then(outcome => { if (!active) return; setState({ phase: "done", outcome }); if (outcome.status === "approved") onApproved(); }).catch(() => { if (active) setState({ phase: "error" }); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const Steps = ({ current }: { current: number }) => <ol className="co-steps">{l.steps.map((label, index) => <li key={label} className={index + 1 < current ? "is-done" : index + 1 === current ? "is-current" : ""}><span>{index + 1 < current ? "✓" : index + 1}</span>{label}</li>)}</ol>;
  const notice = (icon: string, title: string, body: React.ReactNode, actions: React.ReactNode, tone = "warn") => <main className="co co-done"><Steps current={3} /><section className="co-done-card" role="status"><div className={`co-check co-check-${tone}`} aria-hidden="true">{icon}</div><h1>{title}</h1><p className="co-note">{body}</p><div className="co-done-actions">{actions}</div></section></main>;

  if (state.phase === "loading") return <main className="co co-done"><Steps current={3} /><section className="co-done-card" role="status" aria-busy="true"><div className="co-spinner" aria-hidden="true" /><h1>{l.loading}</h1><p className="co-note">{l.loadingHint}</p></section></main>;
  if (state.phase === "error") return notice("!", l.errorTitle, l.errorText, <button className="checkout" type="button" onClick={() => setAttempt(value => value + 1)}>{l.reload}</button>);

  const { outcome } = state;
  const retry = <><Link className="checkout" href={checkoutPath}>{l.retry} →</Link><Link className="co-secondary" href="/">{l.keepShopping}</Link></>;
  if (outcome.status !== "approved") {
    if (outcome.status === "rejected") return notice("✕", l.rejectedTitle, l.rejectedText, retry, "bad");
    if (outcome.status === "aborted") return notice("!", l.abortedTitle, l.abortedText, retry);
    if (outcome.status === "review") return notice("!", l.reviewTitle, <>{l.reviewText} <a href="mailto:info@bannedcards.cl">info@bannedcards.cl</a>.</>, <Link className="co-secondary" href={accountPath}>{l.myOrders}</Link>);
    return notice("?", l.unknownTitle, l.unknownText, <><Link className="checkout" href={accountPath}>{l.myOrders}</Link><Link className="co-secondary" href="/">{l.keepShopping}</Link></>);
  }

  const { order, payment } = outcome;
  return <main className="co co-done" id="webpay-result">
    <Steps current={4} />
    <section className="co-done-card" role="status">
      <div className="co-check" aria-hidden="true">✓</div>
      <p className="eyebrow">{l.approved}</p>
      <h1>{l.thanks}</h1>
      <p className="co-order-no">{l.orderNo} <b>#{order.display_id}</b> <PaymentBadge status="paid" /></p>
      <ul className="co-lines">{order.items.map(item => <li key={item.title}><div className="co-thumb">{item.thumbnail ? <SkeletonImage src={item.thumbnail} alt="" /> : <span className="co-thumb-empty" aria-hidden="true">📦</span>}</div><div className="co-line-main"><strong>{item.title}</strong><small>{item.quantity} × {price(item.unit_price)}</small></div><b>{price(item.unit_price * item.quantity)}</b></li>)}</ul>
      <p className="co-total"><span>{l.total}</span><strong>{price(order.total)}</strong></p>
      <div className="co-recap">
        {order.delivery && <div><h3>{l.deliverTo}</h3><p>{order.delivery.name}<br />{[order.delivery.address, order.delivery.address2].filter(Boolean).join(", ")}<br />{[order.delivery.comuna, order.delivery.region].filter(Boolean).join(", ")}{order.delivery.phone ? <><br />{order.delivery.phone}</> : null}</p><p className="co-muted">🚚 {l.shipping}</p></div>}
        <div><h3>{l.paidWith}</h3><p>{payment.card_last4 ? <>{l.card} •••• {payment.card_last4}<br /></> : null}{payment.authorization_code ? <>{l.auth} {payment.authorization_code}<br /></> : null}{payment.installments ? `${payment.installments} ${l.installments}` : l.noInstallments}</p>{order.document && <p className="co-muted">{order.document.type === "factura" ? l.factura : l.boleta} · {order.document.rut}</p>}</div>
      </div>
      <p className="co-note">{outcome.email_sent ? l.emailOk : l.emailFail}</p>
      {payment.environment !== "production" && <p className="co-note co-test-payment">{l.testPayment}</p>}
      <h3 className="co-next-title">{l.next}</h3>
      <ol className="co-next">{l.nextText.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
      <div className="co-done-actions"><Link className="checkout" href={`${accountPath}?tab=orders&order=${encodeURIComponent(order.id)}`}>{l.viewOrder} →</Link><Link className="co-secondary" href="/">{l.keepShopping}</Link></div>
    </section>
  </main>;
}
