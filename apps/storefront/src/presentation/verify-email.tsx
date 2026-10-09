"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { confirmEmail } from "@/adapters/account-repository";
import { useLocale } from "./locale-provider";

type State = "checking" | "ok" | "failed";

function StatusIcon({ state }: { state: State }) {
  if (state === "checking") return <span className="status-icon status-icon-checking" aria-hidden="true"><span className="status-spinner" /></span>;
  return <span className={`status-icon status-icon-${state}`} aria-hidden="true">
    <svg viewBox="0 0 52 52" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {state === "ok" ? <path className="status-draw" d="M14 27l8 8 16-17" /> : <><path className="status-draw" d="M26 14v16" /><path d="M26 38h.01" /></>}
    </svg>
  </span>;
}

export function VerifyEmail() {
  const { t } = useLocale();
  const [state, setState] = useState<State>("checking");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    // Confirming twice is harmless, so reloading the link never turns a good result into an error.
    if (!token) { setState("failed"); return; }
    let active = true;
    confirmEmail(token).then(ok => { if (active) setState(ok ? "ok" : "failed"); }).catch(() => { if (active) setState("failed"); });
    return () => { active = false; };
  }, []);
  return <section className="status-page" aria-live="polite">
    <div className={`status-card status-card-${state}`}>
      <StatusIcon state={state} />
      {state === "checking" && <>
        <h1>{t("Confirming your email…")}</h1>
        <p>{t("This only takes a moment.")}</p>
      </>}
      {state === "ok" && <>
        <p className="eyebrow">{t("All set")}</p>
        <h1>{t("Your email is confirmed")}</h1>
        <p>{t("Thank you! Your account is verified and ready to go.")}</p>
        <div className="status-actions">
          <Link className="status-button" href="/">{t("Start shopping")}</Link>
        </div>
      </>}
      {state === "failed" && <>
        <p className="eyebrow">{t("Link not valid")}</p>
        <h1>{t("We couldn’t confirm your email")}</h1>
        <p>{t("The link may have expired or been replaced by a newer one. Sign in, open your profile and press “Resend email” to get a fresh link.")}</p>
        <div className="status-actions">
          <Link className="status-button" href="/">{t("Back to the store")}</Link>
        </div>
      </>}
    </div>
  </section>;
}
