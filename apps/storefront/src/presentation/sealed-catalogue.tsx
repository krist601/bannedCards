"use client";
import { useEffect, useRef, useState } from 'react';
import { loadSealedPage } from '@/adapters/sealed-repository';
import { CardImage } from './card-image';
import type { Cart, CatalogueItem } from '@/domain/commerce';
const money = (amount: number) => new Intl.NumberFormat('es-CL', {style:'currency',currency:'CLP',maximumFractionDigits:0}).format(amount);
export function SealedCatalogue({query, cart, disabled, onAdd}: {query:string;cart:Cart;disabled:boolean;onAdd(item:CatalogueItem):void}) {
  const [items,setItems] = useState<CatalogueItem[]>([]);
  const [offset,setOffset] = useState(0);
  const [next,setNext] = useState<number|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  // Remounting the results on a query change prevents pages from different searches mixing.
  useEffect(()=>{
    const controller = new AbortController();
    setLoading(true);setError('');
    const timer=setTimeout(()=>{
      loadSealedPage(query,offset,controller.signal).then(page=>{
        if(controller.signal.aborted)return;
        setItems(previous=>offset===0?page.items:[...new Map([...previous,...page.items].map(item=>[item.id,item])).values()]);
        setNext(page.nextOffset);setLoading(false);
      }).catch(error=>{if(!controller.signal.aborted){setError(error instanceof Error?error.message:'Unable to load products.');setLoading(false);}});
    },query?250:0);
    return()=>{clearTimeout(timer);controller.abort();};
  },[query,offset,attempt]);
  useEffect(()=>{
    if(!sentinel.current||loading||error||next===null)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))setOffset(next);},{rootMargin:'300px'});
    observer.observe(sentinel.current);return()=>observer.disconnect();
  },[loading,error,next]);
  return <section id="sealed" className="catalogue sealed-catalogue">
    <div className="section-head"><div><p className="eyebrow">Open something new</p><h2>Sealed products</h2><p>Booster boxes, packs, bundles and decks.</p></div></div>
    <div className="card-grid sealed-grid">{items.map(item=>{
      const quantity=cart.find(line=>line.id===item.id)?.quantity??0;
      const soldOut=item.stock!==null&&item.stock<=quantity;
      return <article className="product sealed-product" key={item.id}>
        <div className="sealed-image"><CardImage item={item}/></div><div className="product-details">
          <small>{item.set || 'Factory sealed'}</small><h3>{item.name}</h3>
          <div className="sealed-purchase"><strong>{item.price===null?'Price unavailable':money(item.price)}</strong><button type="button" disabled={disabled||soldOut||item.price===null} onClick={()=>onAdd(item)}>Add</button></div>
          <p>{item.stock===0?'Out of stock':item.stock===null?'Available':`${item.stock} in stock`}{quantity>0?` · ${quantity} in cart`:''}</p>
        </div></article>;
    })}</div>
    {!loading&&!error&&items.length===0&&<p>{query?'No sealed products match your search.':'Sealed products are coming soon. Explore the latest singles below.'}</p>}
    <div ref={sentinel} className="catalogue-pagination">{loading&&<p role="status">Loading sealed products…</p>}{error&&<p role="alert">{error} <button onClick={()=>setAttempt(value=>value+1)}>Retry</button></p>}{!loading&&!error&&next!==null&&<button onClick={()=>setOffset(next)}>Load more products</button>}</div>
  </section>;
}
