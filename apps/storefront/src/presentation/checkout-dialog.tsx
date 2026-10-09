"use client";
import { useEffect, useRef, useState } from "react";
import type { Cart, CheckoutContact, PlacedOrder } from "@/domain/commerce";
import { lineAvailability, purchasableQuantity } from "@/application/cart";
import { CheckoutFailed, type StockProblem } from "@/adapters/medusa-repositories";
import { useLocale } from "./locale-provider";

type Props = { cart: Cart; total: number; customer: string; price(value: number): string; onSubmit(contact: CheckoutContact): Promise<PlacedOrder>; onClose(): void; onBackToCart(): void };

export function PaymentBadge({ status }: { status: "paid" | "not_paid" }) {
  const { t } = useLocale();
  return <span className={`payment-badge payment-badge-${status === "paid" ? "paid" : "unpaid"}`}>{status === "paid" ? t("Paid") : t("Not paid")}</span>;
}

/** Test checkout: contact details, summary and a button that places an unpaid order. */
export function CheckoutDialog({ cart, total, customer, price, onSubmit, onClose, onBackToCart }: Props) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<CheckoutContact>({ name: customer.includes("@") ? "" : customer });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [problems, setProblems] = useState<StockProblem[]>([]), [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const lines = cart.filter(line => lineAvailability(line) === "ok" || purchasableQuantity(line) > 0);
  useEffect(() => { dialog.current?.querySelector<HTMLElement>("input")?.focus(); const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [busy, onClose]);
  const field = (name: keyof CheckoutContact, value: string) => setContact(current => ({ ...current, [name]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setProblems([]);
    try { setPlaced(await onSubmit(contact)); }
    catch (failure) {
      if (failure instanceof CheckoutFailed && failure.problems.length) { setProblems(failure.problems); setError(t("Some products ran out while you were checking out. Your order was not placed.")); }
      else setError(failure instanceof Error ? t(failure.message) : t("The order could not be placed. Nothing was charged."));
    } finally { setBusy(false); }
  }
  return <div className="overlay modal-wrap"><div className="login-modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" ref={dialog}>
    <button className="close modal-close" type="button" aria-label={t("Close")} disabled={busy} onClick={onClose}>×</button>
    {placed ? <div className="checkout-done" role="status">
      <div className="checkout-check" aria-hidden="true">✓</div>
      <p className="eyebrow">{t("Order placed")}</p>
      <h2 id="checkout-title">{t("Thank you! Your order")} #{placed.displayId}</h2>
      <p><PaymentBadge status={placed.paymentStatus} /></p>
      <ul className="checkout-lines">{placed.items.map(item => <li key={item.title}><span>{item.quantity} × {item.title}</span><b>{price(item.unitPrice * item.quantity)}</b></li>)}</ul>
      <p className="checkout-total"><span>{t("Total")}</span><strong>{price(placed.total)}</strong></p>
      <p className="checkout-note">{placed.emailSent ? t("We emailed you a summary of your purchase.") : t("We could not send the summary email, but your order is saved in your profile.")}</p>
      <p className="checkout-note">{t("This is a test order: no payment was taken.")}</p>
      <button className="checkout" type="button" onClick={onClose}>{t("Continue shopping")}</button>
    </div> : <form onSubmit={submit}>
      <p className="eyebrow">{t("Test checkout")}</p>
      <h2 id="checkout-title">{t("Review your order")}</h2>
      <ul className="checkout-lines">{lines.map(line => <li key={line.id}><span>{purchasableQuantity(line)} × {line.name}</span><b>{price(line.price * purchasableQuantity(line))}</b></li>)}</ul>
      <p className="checkout-total"><span>{t("Total")}</span><strong>{price(total)}</strong></p>
      <p className="checkout-test-note">{t("Test mode: your order will be saved as “Not paid” and no payment will be taken. Stock is reserved for you.")}</p>
      <div className="checkout-fields">
        <label>{t("Full name")}<input autoComplete="name" value={contact.name ?? ""} onChange={e => field("name", e.target.value)} maxLength={120} /></label>
        <label>{t("Phone")}<input autoComplete="tel" inputMode="tel" value={contact.phone ?? ""} onChange={e => field("phone", e.target.value)} maxLength={40} /></label>
        <label>{t("Address")}<input autoComplete="street-address" value={contact.address ?? ""} onChange={e => field("address", e.target.value)} maxLength={200} /></label>
        <label>{t("City")}<input autoComplete="address-level2" value={contact.city ?? ""} onChange={e => field("city", e.target.value)} maxLength={80} /></label>
        <label className="checkout-wide">{t("Notes (optional)")}<textarea rows={2} value={contact.notes ?? ""} onChange={e => field("notes", e.target.value)} maxLength={500} /></label>
      </div>
      {error && <div role="alert" className="checkout-error"><p>{error}</p>{!!problems.length && <ul>{problems.map(problem => <li key={problem.variant_id}>{problem.title}: {t("you asked for")} {problem.requested}, {problem.available > 0 ? `${t("only")} ${problem.available} ${t("left")}` : t("sold out")}</li>)}</ul>}{!!problems.length && <button type="button" className="text-button" onClick={onBackToCart}>{t("Back to cart")}</button>}</div>}
      <button className="checkout" type="submit" disabled={busy || !lines.length}>{busy ? t("Placing your order…") : t("Place order")}</button>
    </form>}
  </div></div>;
}
