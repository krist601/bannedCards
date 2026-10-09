"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { completeGoogleSignIn, onGoogleProgress, type GoogleStep } from "@/adapters/google-auth";
import { BrandLogo } from "./brand-logo";
import { useLocale } from "./locale-provider";

const text = {
  es: {
    working: "Iniciando sesión con Google", workingHint: "Solo toma unos segundos. No cierres esta ventana.",
    steps: ["Verificando tu cuenta de Google", "Creando tu sesión segura", "Preparando tu tienda"],
    done: "¡Bienvenido a Banned Cards!", doneHint: "Listo, te estamos llevando de vuelta a la tienda…", go: "Ir ahora",
    failed: "No pudimos iniciar sesión con Google", back: "Volver a la tienda", retry: "Intentar de nuevo", help: "Si el problema sigue, puedes crear tu cuenta con correo y contraseña.",
  },
  en: {
    working: "Signing you in with Google", workingHint: "It only takes a few seconds. Please don't close this window.",
    steps: ["Verifying your Google account", "Creating your secure session", "Getting your store ready"],
    done: "Welcome to Banned Cards!", doneHint: "All set, taking you back to the store…", go: "Go now",
    failed: "We could not sign you in with Google", back: "Back to the store", retry: "Try again", help: "If the problem continues, you can create your account with email and password.",
  },
} as const;

const order: GoogleStep[] = ["verify", "session", "prepare", "done"];
export type GoogleView = { phase: "working"; step: GoogleStep } | { phase: "done"; href: string } | { phase: "error"; message: string };

/** The welcome screen shown while Google hands the shopper back to the store. */
export function GoogleSignInView({ view, translate }: { view: GoogleView; translate?(message: string): string }) {
  const { locale } = useLocale();
  const l = text[locale === "en" ? "en" : "es"];
  return <main className="gc">
    <div className="gc-card" role="status" aria-live="polite">
      <div className="gc-logo"><BrandLogo /></div>
      {view.phase === "error" ? <>
        <div className="gc-icon gc-icon-bad" aria-hidden="true">!</div>
        <h1>{l.failed}</h1>
        <p className="gc-note" role="alert">{translate ? translate(view.message) : view.message}</p>
        <div className="gc-actions"><Link className="checkout" href="/">{l.back}</Link></div>
        <p className="gc-help">{l.help}</p>
      </> : view.phase === "done" ? <>
        <div className="gc-icon gc-icon-ok" aria-hidden="true">✓</div>
        <h1>{l.done}</h1>
        <p className="gc-note">{l.doneHint}</p>
        <div className="gc-actions"><a className="checkout" href={view.href}>{l.go} →</a></div>
      </> : <>
        <div className="gc-spinner" aria-hidden="true" />
        <h1>{l.working}</h1>
        <p className="gc-note">{l.workingHint}</p>
        <ol className="gc-steps">{l.steps.map((label, index) => {
          const reached = order.indexOf(view.step), state = index < reached ? "is-done" : index === reached ? "is-current" : "";
          return <li key={label} className={state} aria-current={state === "is-current" ? "step" : undefined}><span>{state === "is-done" ? "✓" : index + 1}</span>{label}</li>;
        })}</ol>
      </>}
    </div>
  </main>;
}

/** Finishes the Google sign-in and then sends the shopper back to where they were. */
export function GoogleCallback() {
  const { t } = useLocale();
  const [view, setView] = useState<GoogleView>({ phase: "working", step: "verify" });
  useEffect(() => {
    let active = true;
    const stop = onGoogleProgress(step => { if (active && step !== "done") setView({ phase: "working", step }); });
    completeGoogleSignIn().then(path => {
      if (!active) return;
      setView({ phase: "done", href: path });
      window.setTimeout(() => { if (active) window.location.replace(path); }, 1100);
    }).catch(error => { if (active) setView({ phase: "error", message: error instanceof Error ? error.message : "Google sign-in failed. Please try again." }); });
    return () => { active = false; stop(); };
  }, []);
  return <GoogleSignInView view={view} translate={t} />;
}
