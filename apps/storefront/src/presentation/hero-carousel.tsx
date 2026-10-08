"use client";
import {useLocale} from "./locale-provider";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseBulkList, planBulk, type BulkAllocation, type BulkMatch } from "@/application/bulk-cards";
import { findBulkCards } from "@/adapters/bulk-card-repository";
import type { Cart } from "@/domain/commerce";
const money=(amount:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(amount);
type Props={sealedEnabled?:boolean;singlesEnabled?:boolean;bulkEnabled?:boolean;openRequest?:number;hideBanner?:boolean;home?:boolean;cart:Cart;disabled:boolean;onAdd(entries:BulkAllocation[]):Promise<{success:boolean;added:BulkAllocation[]}>;onOpenCart():void};
export function HeroCarousel({cart,disabled,onAdd,onOpenCart,sealedEnabled=true,singlesEnabled=true,bulkEnabled=true,home=false,openRequest=0,hideBanner=false}:Props){
 const {t}=useLocale();
  const [slide,setSlide]=useState(0);
  const slides=home?[...(sealedEnabled?[0]:[]),...(singlesEnabled?[1]:[])]:(bulkEnabled?[0,1]:[0]);
  const visibleSlide=slides.includes(slide)?slide:slides[0];
  const noBanner=hideBanner||slides.length===0;
  const advance=(direction:number)=>setSlide(slides[(slides.indexOf(visibleSlide)+direction+slides.length)%slides.length]);
  const [open,setOpen]=useState(false);
  useEffect(()=>{if(openRequest>0)setOpen(true);},[openRequest]);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    if(!open) return;
    const modal=dialog.current;
    const previousOverflow=document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow='hidden';
    modal?.querySelector('textarea')?.focus();
    return ()=>{modal?.close();document.body.style.overflow=previousOverflow;};
  },[open]);
  const [text,setText]=useState('');
  const [matches,setMatches]=useState<BulkMatch[]|null>(null);
  const [loading,setLoading]=useState(false);
  const [adding,setAdding]=useState(false);
  const [error,setError]=useState('');
  const [status,setStatus]=useState('');
  const active=useRef<AbortController|null>(null);
  const lock=useRef(false);
  useEffect(()=>()=>active.current?.abort(),[]);
  const plan=useMemo(()=>planBulk(matches??[],cart),[matches,cart]);
  const allocations=plan.flatMap(row=>row.allocations);
  const count=allocations.reduce((sum,entry)=>sum+entry.quantity,0);
  const total=allocations.reduce((sum,entry)=>sum+entry.quantity*entry.card.price!,0);
  async function find(event:React.FormEvent){
    event.preventDefault(); if(lock.current) return;
    const lines=parseBulkList(text);
    setStatus('');setError('');setMatches(null);
    if(!lines.length || lines.length>50){setError('Enter between 1 and 50 card lines.');return;}
    active.current?.abort();const controller=new AbortController();active.current=controller;setLoading(true);
    try{const result=await findBulkCards(lines,controller.signal);if(!controller.signal.aborted)setMatches(result);}
    catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Unable to check stock. Try again.');}
    finally{if(active.current===controller)setLoading(false);}
  }
  async function add(){
    if(lock.current||disabled||!count)return;
    lock.current=true;setAdding(true);setError('');
    try{
      const result=await onAdd(allocations);
      const added=result.added.reduce((sum,entry)=>sum+entry.quantity,0);
      setMatches(null);
      setStatus(result.success?`${added} ${added===1?'card':'cards'} added to your cart.`:`${added} cards confirmed added before the request stopped. Check your cart before checking the list again.`);
      if(!result.success)setError('Could not finish adding the list. Current cart contents are preserved.');
    }catch{setMatches(null);setError('Could not confirm the cart update. Check your cart before trying again.');}
    finally{lock.current=false;setAdding(false);}
  }
  return <>{!noBanner&&<section id="top" className="hero hero-carousel" aria-roledescription="carousel" aria-label="Store highlights">
    {slides.length>1&&<div className="hero-controls" aria-label="Banner navigation">
      <button type="button" aria-label="Previous banner" onClick={()=>advance(-1)}>←</button>
      <button type="button" aria-pressed={visibleSlide===0} onClick={()=>setSlide(0)}>{home?t("Sealed products"):t("Discover")}</button>
      <button type="button" aria-pressed={visibleSlide===1} onClick={()=>setSlide(1)}>{home?t("Singles"):t("Bulk finder")}</button>
      <button type="button" aria-label="Next banner" onClick={()=>advance(1)}>→</button>
    </div>}
    {home && sealedEnabled && <div className="hero-slide" aria-hidden={visibleSlide!==0} inert={visibleSlide!==0} role="group" aria-roledescription="slide" aria-label={t("Sealed products")}><p className="eyebrow">{t("Open something new")}</p><h1>{t("Your next opening")}<br/>{t("starts here.")}</h1><p className="hero-copy">{t("Explore booster packs, boxes, bundles, precons and special releases.")}</p><Link className="button" href="/sealed">{t("Browse sealed products")}</Link></div>}
    {(!home||singlesEnabled)&&<div className="hero-slide" aria-hidden={visibleSlide!==(home?1:0)} inert={visibleSlide!==(home?1:0)} role="group" aria-roledescription="slide" aria-label={home?"2 of 2: Singles":"1 of 2: Discover"}>
      <p className="eyebrow">Magic: The Gathering · Chile</p><h1>{t("Find the next card")}<br/>{t("for your deck.")}</h1><p className="hero-copy">{t("Singles from the newest Magic releases and the journey through Middle-earth. Every listing is the exact card you will receive.")}</p><Link className="button" href="/singles">{t("Browse singles")}</Link>
    </div>}
    {!home && bulkEnabled && <div className="hero-slide" aria-hidden={visibleSlide!==1} inert={visibleSlide!==1} role="group" aria-roledescription="slide" aria-label="2 of 2: Bulk finder">
      <div className="bulk-intro"><p className="eyebrow">{t("Build your deck faster")}</p><h2>{t("Find your list.")}</h2><p className="hero-copy">{t("Paste your cards, check available copies, then add the matches to your cart.")}</p></div>
      <button className="button" type="button" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{t("Open bulk finder")}</button>
    </div>}
  </section>}
  <dialog ref={dialog} className="bulk-dialog" aria-labelledby="bulk-dialog-title" onClose={()=>setOpen(false)}>
    <div className="bulk-dialog-heading"><div><p className="eyebrow">{t("Build your deck faster")}</p><h2 id="bulk-dialog-title">{t("Bulk card finder")}</h2></div><button className="close" type="button" aria-label="Close bulk finder" onClick={()=>setOpen(false)}>×</button></div>
      <form className="bulk-form" onSubmit={event=>void find(event)}>
        <label htmlFor="bulk-list">{t("One card per line")}</label>
        <textarea id="bulk-list" rows={4} maxLength={12000} value={text} disabled={adding} aria-describedby="bulk-help" placeholder={'1x the one ring\n1 the one ring F\n4x the one ring (LOR)'} onChange={event=>{active.current?.abort();setLoading(false);setText(event.target.value);setMatches(null);setError('');setStatus('');}} />
        <p id="bulk-help">Quantity + name · F = foil · (SET) = set code. Without F, search normal copies. Up to 50 lines.</p>
        <button className="button" type="submit" disabled={loading||adding||!text.trim()}>{loading?'Checking stock…':t("Check stock")}</button>
      </form>
      {error&&<p className="bulk-message" role="alert">{error}</p>}
      {status&&<p className="bulk-message" role="status">{status} <button type="button" onClick={()=>{setOpen(false);onOpenCart();}}>{t("View cart")}</button></p>}
      {matches&&<div className="bulk-review" aria-label="Bulk finder results">
        <h3>{t("Review your matches")}</h3><p>Cheapest available copies are selected first. You can choose a specific version below. Quantities already in your cart are excluded from available stock.</p>
        <ol>{plan.map((row,index)=><li key={row.request.line}>
          <strong>{row.request.quantity}× {row.request.name} {row.request.foil?'· Foil':''} {row.request.setCode?`(${row.request.setCode.toUpperCase()})`:''}</strong>
          {row.request.note&&<p>{row.request.note}</p>}
          {row.request.error?<p role="alert">Line {row.request.line}: {row.request.error}</p>:<>
            {row.candidates.length>1&&<label>{t("Version")}<select disabled={adding} value={row.selectedId??''} onChange={event=>setMatches(previous=>previous!.map((match,i)=>i===index?{...match,selectedId:event.target.value||undefined}:match))}><option value="">Cheapest available copies</option>{row.candidates.map(card=><option key={card.id} value={card.id}>{card.set} #{card.attributes?.collectorNumber} · {card.condition} · {card.attributes?.language??'language unspecified'} · {money(card.price!)}</option>)}</select></label>}
            {row.allocations.map(entry=><p key={entry.card.id}>{entry.quantity}× {entry.card.set} #{entry.card.attributes?.collectorNumber} · {entry.card.condition} · {entry.card.attributes?.language??'language unspecified'} — {money(entry.card.price!)} each</p>)}
            {row.missing>0&&<p className="bulk-shortage">{row.missing} {row.allocations.length?'more copies unavailable':'copies unavailable for this name, finish and set'}.</p>}
          </>}
        </li>)}</ol>
        <div className="bulk-total"><strong>{count} cards · {money(total)}</strong><button className="button" type="button" disabled={disabled||adding||count===0} onClick={()=>void add()}>{adding?'Adding…':`Add ${count} cards to cart`}</button></div>
      </div>}
  </dialog></>;
}
