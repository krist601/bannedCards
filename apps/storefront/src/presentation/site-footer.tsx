"use client";
import Link from "next/link";
import { accountPath, contactEmail, instagramHandle, instagramUrl, joinNames, pagePaths, paymentProviders, shippingProviders, siteName } from "@/config/site";
import { useSections } from "./sections-provider";
import { useLocale } from "./locale-provider";
import { BrandLogo } from "./brand-logo";

const text = {
  es: {
    strip: [
      { title: "Envíos a todo Chile", body: (carriers: string) => `Despachamos con ${carriers} a todo el país.`, link: "Más información", href: `${pagePaths.terms}#envios` },
      { title: "Atención al cliente", body: () => "Estamos aquí para ayudarte con tu pedido o con cualquier duda.", link: "Escríbenos", href: pagePaths.contact },
      { title: "Síguenos", body: () => "Entérate primero de novedades, lanzamientos y ofertas.", link: "Ver Instagram", href: instagramUrl },
    ],
    top: "Volver arriba",
    support: "Atención al cliente", contact: "Contacto", shipping: "Envíos y despachos", returns: "Cambios y devoluciones", terms: "Términos y condiciones",
    account: "Mi cuenta", profile: "Mi perfil", orders: "Historial de pedidos",
    shop: "Tienda", singles: "Cartas sueltas", sealed: "Productos sellados", custom: "Productos personalizados", accessories: "Accesorios", sell: "Vende tus cartas",
    company: "Empresa", about: "Acerca de nosotros", privacy: "Política de privacidad",
    follow: "Síguenos", payments: "Medios de pago", delivery: "Despacho",
    rights: "Todos los derechos reservados.", online: "Venta online · Despacho a todo Chile",
    legal: `Magic: The Gathering es una marca de Wizards of the Coast LLC. ${siteName} no está afiliada ni patrocinada por Wizards of the Coast.`,
    testMode: "Modo de prueba: los pedidos no se cobran", demo: "Tienda de demostración", staff: "Administración",
  },
  en: {
    strip: [
      { title: "Shipping across Chile", body: (carriers: string) => `We deliver with ${carriers} nationwide.`, link: "Learn more", href: `${pagePaths.terms}#envios` },
      { title: "Customer support", body: () => "We are here to help with your order or any question.", link: "Write to us", href: pagePaths.contact },
      { title: "Follow us", body: () => "Be the first to know about news, releases and offers.", link: "See Instagram", href: instagramUrl },
    ],
    top: "Back to top",
    support: "Customer support", contact: "Contact us", shipping: "Shipping and delivery", returns: "Exchanges and returns", terms: "Terms and conditions",
    account: "My account", profile: "My profile", orders: "Order history",
    shop: "Shop", singles: "Singles", sealed: "Sealed products", custom: "Custom products", accessories: "Accessories", sell: "Sell your cards",
    company: "Company", about: "About us", privacy: "Privacy policy",
    follow: "Follow us", payments: "Payment methods", delivery: "Delivery",
    rights: "All rights reserved.", online: "Online store · Delivery across Chile",
    legal: `Magic: The Gathering is a trademark of Wizards of the Coast LLC. ${siteName} is not affiliated with or endorsed by Wizards of the Coast.`,
    testMode: "Test mode: orders are not charged", demo: "Demo store", staff: "Staff",
  },
} as const;

const InstagramIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>;
const MailIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>;

export function SiteFooter({ testCheckout, demo }: { testCheckout: boolean; demo: boolean }) {
  const { locale } = useLocale();
  const sections = useSections();
  const l = text[locale === "en" ? "en" : "es"];
  const carriers = joinNames(shippingProviders, locale);
  return <footer className="site-footer" id="about">
    <div className="footer-strip">
      {l.strip.map(item => <div key={item.title}>
        <h2>{item.title}</h2>
        <p>{item.body(carriers)}</p>
        {item.href.startsWith("/") ? <Link href={item.href}>{item.link} ›</Link> : <a href={item.href} target="_blank" rel="noopener noreferrer">{item.link} ›</a>}
      </div>)}
    </div>
    <button type="button" className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span aria-hidden="true">⌃</span>{l.top}</button>
    <div className="footer-main">
      <div className="footer-columns">
        <div role="group" aria-label={l.support} className="footer-col"><h3>{l.support}</h3>
          <Link href={pagePaths.contact}>{l.contact}</Link>
          <Link href={`${pagePaths.terms}#envios`}>{l.shipping}</Link>
          <Link href={`${pagePaths.terms}#cambios`}>{l.returns}</Link>
          <Link href={pagePaths.terms}>{l.terms}</Link>
        </div>
        <div role="group" aria-label={l.account} className="footer-col"><h3>{l.account}</h3>
          <Link href={accountPath}>{l.profile}</Link>
          <Link href={`${accountPath}?tab=orders`}>{l.orders}</Link>
        </div>
        <div role="group" aria-label={l.shop} className="footer-col"><h3>{l.shop}</h3>
          {sections.singles && <Link href="/singles">{l.singles}</Link>}
          {sections.sealed && <Link href="/sealed">{l.sealed}</Link>}
          {sections.custom && <Link href="/custom">{l.custom}</Link>}
          {sections.accessories && <Link href="/accessories">{l.accessories}</Link>}
          {sections.buyCards && <Link href="/sell-cards">{l.sell}</Link>}
        </div>
        <div role="group" aria-label={l.company} className="footer-col"><h3>{l.company}</h3>
          <Link href={pagePaths.about}>{l.about}</Link>
          <Link href={pagePaths.privacy}>{l.privacy}</Link>
          <Link href={pagePaths.terms}>{l.terms}</Link>
        </div>
        <div className="footer-col"><h3>{l.follow}</h3>
          <div className="footer-social">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${instagramHandle}`} title={instagramHandle}><InstagramIcon /></a>
            <a href={`mailto:${contactEmail}`} aria-label={contactEmail} title={contactEmail}><MailIcon /></a>
          </div>
          <a className="footer-email" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </div>
      </div>
      <div className="footer-providers">
        <div><span>{l.payments}</span>{paymentProviders.map(name => <b key={name}>{name}</b>)}</div>
        <div><span>{l.delivery}</span>{shippingProviders.map(name => <b key={name}>{name}</b>)}</div>
      </div>
    </div>
    <div className="footer-bottom">
      <Link className="footer-brand" href="/" aria-label={`${siteName} home`}><BrandLogo square /></Link>
      <div>
        <p>© {new Date().getFullYear()} {siteName}. {l.rights} · {l.online}</p>
        <p className="footer-legal">{l.legal}</p>
        {(testCheckout || demo) && <p className="footer-mode">{demo ? l.demo : l.testMode}</p>}
      </div>
      <a className="footer-staff" href="/cms">{l.staff} ↗</a>
    </div>
  </footer>;
}
