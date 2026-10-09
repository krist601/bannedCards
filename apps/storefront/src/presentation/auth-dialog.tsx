"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { pagePaths } from "@/config/site";
import { GoogleButton } from "./google-button";
import { useLocale } from "./locale-provider";

export type AuthValues = { email: string; password: string; firstName: string };
export type AuthMode = "login" | "register";

const text = {
  es: {
    close: "Cerrar", tabs: { login: "Iniciar sesión", register: "Crear cuenta" },
    brandTitle: "Tu cuenta Banned Cards", brandLead: "Compra más rápido y lleva el control de todo.",
    perks: ["Tu carrito queda guardado y lo retomas desde cualquier dispositivo", "Sigue el estado y el pago de tus pedidos", "Recibe el resumen de tu compra por correo", "Compra segura con despacho a todo Chile"],
    loginTitle: "Bienvenido de vuelta", loginLead: "Entra para ver tus pedidos y continuar tu compra.",
    registerTitle: "Crea tu cuenta", registerLead: "Es gratis y toma menos de un minuto.",
    checkoutTitle: "Crea tu cuenta para comprar", checkoutLead: "Necesitamos una cuenta para tu pedido. Tu carrito actual se guardará en ella; si ya tienes cuenta, inicia sesión.",
    divider: "o continúa con tu correo", firstName: "Nombre", email: "Correo electrónico", password: "Contraseña", show: "Mostrar", hide: "Ocultar",
    passwordHint: "Mínimo 8 caracteres. Mezcla letras y números para hacerla más segura.", strength: ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"],
    submitLogin: "Iniciar sesión", submitRegister: "Crear mi cuenta", working: "Un momento…",
    terms: (terms: React.ReactNode, privacy: React.ReactNode) => <>Al crear tu cuenta aceptas los {terms} y la {privacy}.</>, termsLabel: "Términos y condiciones", privacyLabel: "Política de privacidad",
    haveAccount: "¿Ya tienes cuenta?", noAccount: "¿Aún no tienes cuenta?", demoNote: "Modo de demostración: inicia sesión localmente para probar la tienda.",
  },
  en: {
    close: "Close", tabs: { login: "Log in", register: "Create account" },
    brandTitle: "Your Banned Cards account", brandLead: "Shop faster and keep track of everything.",
    perks: ["Your cart is saved and available from any device", "Follow the status and payment of your orders", "Get your purchase summary by email", "Secure shopping with delivery across Chile"],
    loginTitle: "Welcome back", loginLead: "Log in to see your orders and continue your purchase.",
    registerTitle: "Create your account", registerLead: "It is free and takes less than a minute.",
    checkoutTitle: "Create your account to buy", checkoutLead: "We need an account for your order. Your current cart will be saved to it; if you already have one, log in.",
    divider: "or continue with your email", firstName: "First name", email: "Email address", password: "Password", show: "Show", hide: "Hide",
    passwordHint: "At least 8 characters. Mix letters and numbers to make it stronger.", strength: ["Very weak", "Weak", "Fair", "Good", "Excellent"],
    submitLogin: "Log in", submitRegister: "Create my account", working: "One moment…",
    terms: (terms: React.ReactNode, privacy: React.ReactNode) => <>By creating an account you accept the {terms} and the {privacy}.</>, termsLabel: "Terms and conditions", privacyLabel: "Privacy policy",
    haveAccount: "Already have an account?", noAccount: "Don’t have an account yet?", demoNote: "Demo mode: sign in locally to try the store.",
  },
} as const;

/** 0–4 score from length and character variety; only a visual hint, the server enforces the real rules. */
export function passwordScore(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value) || (/\d/.test(value) && /[A-Za-z]/.test(value) && value.length >= 10)) score++;
  return Math.min(score, 4);
}

const Check = () => <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="8.5" opacity=".35" /><path d="M6.2 10.3l2.6 2.6 5-5.4" /></svg>;

export function AuthDialog({ mode, onMode, checkoutPending, demo, busy, error, onSubmit, onClose }: { mode: AuthMode; onMode(mode: AuthMode): void; checkoutPending: boolean; demo: boolean; busy: boolean; error: string; onSubmit(values: AuthValues): void; onClose(): void }) {
  const { locale, t } = useLocale();
  const l = text[locale === "en" ? "en" : "es"];
  const panel = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<AuthValues>({ email: "", password: "", firstName: "" });
  const [reveal, setReveal] = useState(false);
  const register = mode === "register";
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", key); };
  }, [busy, onClose]);
  useEffect(() => { panel.current?.querySelector<HTMLElement>("input:not([type=hidden])")?.focus(); }, [mode]);
  const field = (name: keyof AuthValues, value: string) => setValues(current => ({ ...current, [name]: value }));
  const score = passwordScore(values.password);
  const title = checkoutPending && register ? l.checkoutTitle : register ? l.registerTitle : l.loginTitle;
  const lead = checkoutPending && register ? l.checkoutLead : register ? l.registerLead : l.loginLead;
  return <div className="auth-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" ref={panel}>
      <aside className="auth-aside">
        <Image src="/brand/logo-horizontal-white.png" alt="Banned Cards" width={200} height={66} priority />
        <h2>{l.brandTitle}</h2>
        <p>{l.brandLead}</p>
        <ul>{l.perks.map(perk => <li key={perk}><Check /><span>{perk}</span></li>)}</ul>
      </aside>
      <section className="auth-main">
        <button className="auth-close" type="button" aria-label={l.close} disabled={busy} onClick={onClose}>×</button>
        {!demo && <div className="auth-tabs" role="tablist">{(["login", "register"] as const).map(key => <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => onMode(key)}>{l.tabs[key]}</button>)}</div>}
        <h2 id="auth-title">{title}</h2>
        <p className="auth-lead">{demo ? l.demoNote : lead}</p>
        {!demo && <><GoogleButton /><div className="auth-divider"><span>{l.divider}</span></div></>}
        <form onSubmit={event => { event.preventDefault(); if (!busy) onSubmit(values); }} noValidate={false}>
          {register && <label>{l.firstName}<input required autoComplete="given-name" value={values.firstName} onChange={e => field("firstName", e.target.value)} maxLength={100} /></label>}
          <label>{l.email}<input type="email" required autoComplete={register ? "email" : "username"} value={values.email} onChange={e => field("email", e.target.value)} placeholder="tu@correo.cl" /></label>
          {!demo && <label>{l.password}
            <span className="auth-password">
              <input type={reveal ? "text" : "password"} required minLength={register ? 8 : undefined} autoComplete={register ? "new-password" : "current-password"} value={values.password} onChange={e => field("password", e.target.value)} />
              <button type="button" onClick={() => setReveal(v => !v)} aria-pressed={reveal}>{reveal ? l.hide : l.show}</button>
            </span>
            {register && <span className="auth-strength" aria-live="polite"><span className={`auth-meter auth-meter-${score}`}><i /><i /><i /><i /></span><small>{values.password ? l.strength[score] : l.passwordHint}</small></span>}
          </label>}
          {error && <p className="auth-error" role="alert">{t(error)}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? l.working : register ? l.submitRegister : l.submitLogin}</button>
          {register && !demo && <p className="auth-terms">{l.terms(<Link href={pagePaths.terms} target="_blank">{l.termsLabel}</Link>, <Link href={pagePaths.privacy} target="_blank">{l.privacyLabel}</Link>)}</p>}
        </form>
        {!demo && <p className="auth-switch">{register ? l.haveAccount : l.noAccount} <button type="button" onClick={() => onMode(register ? "login" : "register")}>{register ? l.tabs.login : l.tabs.register}</button></p>}
      </section>
    </div>
  </div>;
}
