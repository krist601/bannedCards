"use client";
import Link from "next/link";
import { privacyPolicy } from "@/config/privacy-policy";
import { sitePage, type PageContent, type SitePageKey } from "@/config/site-pages";
import { useLocale } from "./locale-provider";

export type ContentPageKey = SitePageKey | "privacy";

/** Renders one of the store's text pages (privacy, about, terms, contact) in the visitor's language. */
export function ContentPage({ page }: { page: ContentPageKey }) {
  const { locale, t } = useLocale();
  const content: PageContent = page === "privacy" ? { ...privacyPolicy(locale), numbered: true } : sitePage(page, locale);
  const numbered = content.numbered !== false;
  return <article className="catalogue legal-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t("Home")}</Link><span aria-hidden="true">›</span><span aria-current="page">{content.title}</span></nav>
    <h1>{content.title}</h1>
    {content.updated && <p className="legal-updated">{content.updated}</p>}
    {content.intro && <p className="legal-intro">{content.intro}</p>}
    {content.sections.map((section, index) => <section key={section.heading} id={(section as { id?: string }).id} aria-labelledby={`${page}-${index}`}>
      <h2 id={`${page}-${index}`}>{numbered ? `${index + 1}. ` : ""}{section.heading}</h2>
      {section.paragraphs?.map(text => <p key={text}>{text}</p>)}
      {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
      {section.after?.map(text => <p key={text}>{text}</p>)}
      {(section as { links?: { label: string; href: string }[] }).links && <ul className="legal-links">{(section as { links: { label: string; href: string }[] }).links.map(link => <li key={link.href}>{link.href.startsWith("/") ? <Link href={link.href}>{link.label}</Link> : <a href={link.href} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label}</a>}</li>)}</ul>}
    </section>)}
    {content.questions && <p className="legal-questions">{content.questions}</p>}
  </article>;
}
