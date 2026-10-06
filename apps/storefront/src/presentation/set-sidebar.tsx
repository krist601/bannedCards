"use client";
import { MobileFilters } from "./mobile-filters";
import {useLocale} from "./locale-provider";
import { useEffect, useRef, useState } from "react";
import type { CatalogueFilter, DirectorySet } from "@/domain/set-directory";
import type { useSetDirectory } from "./use-set-directory";
type Props = { showOutOfStock: boolean; onShowOutOfStockChange(value: boolean): void; cardScale: number; onCardScaleChange(value: number): void; directory: ReturnType<typeof useSetDirectory>; selected: CatalogueFilter; onSelect(filter: CatalogueFilter): void };
function SetIcon({ set }: { set: DirectorySet }) {
  const [failed, setFailed] = useState(false);
  if (!set.iconUrl || failed) return <span className="set-icon set-icon-fallback" aria-hidden="true">◇</span>;
  // Small self-hosted SVGs retain their vector quality without image optimization.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="set-icon" src={set.iconUrl} alt="" width={22} height={22} loading="lazy" onError={() => setFailed(true)} />;
}
export function SetSidebar({ directory, selected, onSelect, cardScale, onCardScaleChange, showOutOfStock, onShowOutOfStockChange }: Props) {
 const {t}=useLocale();
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (directory.motion.direction === "none") return;
    viewport.current?.focus({ preventScroll: true });
    viewport.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [directory.motion]);
  return <MobileFilters><aside className="filters" aria-label="Filter singles">
    <div className="card-size-control">
      <label htmlFor="card-size">{t("Card size")}<output htmlFor="card-size">{cardScale.toFixed(1)}×</output></label>
      <input id="card-size" type="range" min="1" max="2.5" step="0.1" value={cardScale} aria-valuetext={`${cardScale.toFixed(1)} times`} onChange={event => onCardScaleChange(event.target.valueAsNumber)} />
    </div>
    <label className="stock-filter"><input type="checkbox" checked={showOutOfStock} onChange={event => onShowOutOfStockChange(event.target.checked)} />{t("Show out-of-stock cards")}</label>
    <strong>{t("Browse")}</strong>
    {([['added', 'Latest added'], ['latest', 'Latest releases'], ['all', 'All singles']] as const).map(([kind, label]) => <button key={kind} type="button" aria-pressed={selected.kind === kind} className={selected.kind === kind ? "filter-active" : ""} onClick={() => onSelect({ kind })}>{t(label)}</button>)}
    <div className="set-directory">
      <label htmlFor="set-search">{t("Sets")}</label>
      <input id="set-search" type="search" placeholder={t("Find a set…")} value={directory.search} onChange={event => directory.setSearch(event.target.value)} />
      {selected.kind === "set" && <p className="selected-set">{t("Selected")}: {selected.name}</p>}
      {directory.previousOffset !== null && <button className="set-page-control" type="button" disabled={directory.loading} onClick={directory.previous}>{t("Load previous sets")}</button>}
      <div className="set-page-viewport" ref={viewport} tabIndex={-1} aria-label={`Sets page ${Math.floor(directory.offset / 10) + 1}`} aria-busy={directory.loading}>
        <div key={directory.motion.id} className={`set-page set-page-${directory.motion.direction}`}>
          {directory.sets.map(set => <button type="button" key={set.code} className={`set-filter ${selected.kind === "set" && selected.code === set.code ? "filter-active" : ""}`} aria-pressed={selected.kind === "set" && selected.code === set.code} onClick={() => onSelect({ kind: "set", code: set.code, name: set.name, setCodes: set.setCodes })}>
            <SetIcon key={`${set.code}:${set.iconUrl}`} set={set} /><span>{set.name}{set.upcoming && <small>{t("Upcoming")}</small>}</span>
          </button>)}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{!directory.loading && `Page ${Math.floor(directory.offset / 10) + 1}, ${directory.sets.length} sets`}</span>
      {directory.loading && <p role="status">{t("Loading sets…")}</p>}
      {directory.error && <div role="alert">{directory.error} <button type="button" onClick={directory.retry}>{t("Retry")}</button></div>}
      {!directory.loading && !directory.error && !directory.sets.length && <p>{t("No sets found.")}</p>}
      {directory.nextOffset !== null && <button className="set-page-control" type="button" disabled={directory.loading} onClick={() => void directory.more()}>{t("Load more sets")}</button>}
    </div>
  </aside></MobileFilters>;
}
