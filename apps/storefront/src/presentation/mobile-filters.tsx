"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "./locale-provider";
import { createPortal } from "react-dom";

export function MobileFilters({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header');
    const container = header?.closest('main');
    if (!header || !container) return;
    const update = () => container.style.setProperty('--storefront-header-height', `${header.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => { observer.disconnect(); container.style.removeProperty('--storefront-header-height'); };
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 800px)');
    const update = () => {
      setMobile(query.matches);
      setOpen(false);
      setClosing(false);
      if (timer.current) clearTimeout(timer.current);
    };
    update();
    query.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [open, mobile]);
  function close() {
    if (closing) return;
    setClosing(true);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
    timer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      trigger.current?.focus({ preventScroll: true });
    }, duration);
  }
  if (!mobile) return <div className="desktop-filters">{children}</div>;
  return <>
    {document.getElementById('mobile-filter-slot') && createPortal(<button ref={trigger} className="mobile-filter-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls="mobile-filters" onClick={() => setOpen(true)}>{t('Filters')}</button>, document.getElementById('mobile-filter-slot')!)}
    <dialog ref={dialog} id="mobile-filters" className={`mobile-filter-sheet${closing ? ' is-closing' : ''}`} aria-labelledby="mobile-filter-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="mobile-filter-content">
        <header className="mobile-filter-heading"><h2 id="mobile-filter-title">{t('Filters')}</h2><button type="button" aria-label={t('Close filters')} onClick={close}>×</button></header>
        <div className="mobile-filter-scroll">{children}</div>
        <div className="mobile-filter-actions"><button type="button" onClick={close}>{t('Done')}</button></div>
      </div>
    </dialog>
  </>;
}
