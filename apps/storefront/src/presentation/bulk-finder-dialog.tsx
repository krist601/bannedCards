"use client";
import {useLocale} from "./locale-provider";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseBulkList, planBulk, type BulkAllocation, type BulkMatch } from "@/application/bulk-cards";
import { findBulkCards } from "@/adapters/bulk-card-repository";
import type { Cart } from "@/domain/commerce";
const money=(amount:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(amount);
type Props={open:boolean;onClose():void;cart:Cart;disabled:boolean;onAdd(entries:BulkAllocation[]):Promise<{success:boolean;added:BulkAllocation[]}>;onOpenCart():void};
export function BulkFinderDialog({open,onClose,cart,disabled,onAdd,onOpenCart}:Props){
 const {t}=useLocale();
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
  return (
  <dialog ref={dialog} className="bulk-dialog" aria-labelledby="bulk-dialog-title" onClose={onClose}>
    <div className="bulk-dialog-heading"><div><p className="eyebrow">{t("Build your deck faster")}</p><h2 id="bulk-dialog-title">{t("Bulk card finder")}</h2></div><button className="close" type="button" aria-label="Close bulk finder" onClick={onClose}>×</button></div>
      <form className="bulk-form" onSubmit={event=>void find(event)}>
        <label htmlFor="bulk-list">{t("One card per line")}</label>
        <textarea id="bulk-list" rows={4} maxLength={12000} value={text} disabled={adding} aria-describedby="bulk-help" placeholder={'1x the one ring\n1 the one ring F\n4x the one ring (LOR)'} onChange={event=>{active.current?.abort();setLoading(false);setText(event.target.value);setMatches(null);setError('');setStatus('');}} />
        <p id="bulk-help">Quantity + name · F = foil · (SET) = set code. Without F, search normal copies. Up to 50 lines.</p>
        <button className="button" type="submit" disabled={loading||adding||!text.trim()}>{loading?'Checking stock…':t("Check stock")}</button>
      </form>
      {error&&<p className="bulk-message" role="alert">{error}</p>}
      {status&&<p className="bulk-message" role="status">{status} <button type="button" onClick={()=>{onClose();onOpenCart();}}>{t("View cart")}</button></p>}
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
  </dialog>
  );
}
