"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {CatalogueItem,Cart} from '@/domain/commerce';
import {shopSections,type ShopSectionKey} from '@/config/shop-sections';
import {useLocale} from './locale-provider';
import {CardImage} from './card-image';
import {CatalogueSkeleton} from './catalogue-skeleton';
type Props={onSeen?:(items:CatalogueItem[])=>void;section:ShopSectionKey;query:string;cart:Cart;disabled:boolean;onAdd(item:CatalogueItem):void;home?:boolean};
type Page={items:CatalogueItem[];count:number;nextOffset:number|null;categories:{handle:string;name:string;count:number}[]};
const money=(value:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value);
function ProductCard({item,cart,disabled,onAdd}:Pick<Props,'cart'|'disabled'|'onAdd'>&{item:CatalogueItem}){
 const {t}=useLocale();
 const quantity=cart.find(line=>line.id===item.id)?.quantity??0;
 const original=Number(item.attributes?.originalPrice);
 return <article className="product sealed-product"><div className="sealed-image"><CardImage item={item}/></div><div className="product-details"><h3>{item.name}</h3><div className="sealed-purchase"><strong>{item.price===null?t("Price unavailable"):<>{original>item.price&&<del>{money(original)} </del>}{money(item.price)}</>}</strong><button disabled={disabled||item.price===null||item.stock===0||(item.stock!==null&&quantity>=item.stock)} onClick={()=>onAdd(item)}>{t("Add")}</button></div><p>{item.stock===0?t("Out of stock"):item.stock===null?t("Available"):`${item.stock} ${t("in stock")}`}{quantity>0?` · ${quantity} ${t("in cart")}`:''}</p></div></article>;
}
function usePage(section:ShopSectionKey,params:Record<string,string>,offset:number,attempt:number){
 const key=JSON.stringify(params);
 const [page,setPage]=useState<Page|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');
  const timer=setTimeout(()=>{
   fetch(`/api/shop/${section}?${new URLSearchParams({...JSON.parse(key),offset:String(offset)})}`,{signal:controller.signal,cache:'no-store'})
    .then(async response=>{if(!response.ok)throw new Error('Unable to load products. Please retry.');return response.json() as Promise<Page>;})
    .then(next=>{if(!controller.signal.aborted){setPage(previous=>offset===0||!previous?next:{...next,items:[...previous.items,...next.items]});setLoading(false);}})
    .catch(failure=>{if(!controller.signal.aborted){setError(failure.message);setLoading(false);}});
  },JSON.parse(key).q?250:0);
  return()=>{clearTimeout(timer);controller.abort();};
 },[section,key,offset,attempt]);
 return {page,loading,error};
}
/** Home row: the newest products of a section. Renders nothing until the section has products. */
function HomeRow({section,onSeen,...props}:Props){
 const {t}=useLocale();const config=shopSections[section];
 const track=useRef<HTMLDivElement>(null);
 const {page}=usePage(section,{limit:'10'},0,0);
 useEffect(()=>{if(page)onSeen?.(page.items);},[page]); // eslint-disable-line react-hooks/exhaustive-deps
 if(!page?.items.length)return null;
 return <section id={section} className="catalogue sealed-browser"><section className="sealed-row"><div className="section-head"><h2>{t(config.homeTitle)}</h2><div className="row-controls"><button aria-label={`Scroll ${t(config.homeTitle)} left`} onClick={()=>track.current?.scrollBy({left:-track.current.clientWidth,behavior:'smooth'})}>←</button><button aria-label={`Scroll ${t(config.homeTitle)} right`} onClick={()=>track.current?.scrollBy({left:track.current.clientWidth,behavior:'smooth'})}>→</button></div></div><div className="product-track" ref={track}>{page.items.map(item=><ProductCard key={item.id} item={item} {...props}/>)}<Link className="more-tile" href={config.path}><span>{t("Explore more")}</span><strong>{t(config.title)} →</strong></Link></div></section></section>;
}
function SectionPage({section,query,onSeen,...props}:Props){
 const {t}=useLocale();const config=shopSections[section];
 const [category,setCategory]=useState(''),[offset,setOffset]=useState(0),[attempt,setAttempt]=useState(0);
 const {page,loading,error}=usePage(section,{q:query,category},offset,attempt);
 useEffect(()=>{if(page)onSeen?.(page.items);},[page]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>setOffset(0),[query,category]);
 return <section id={section} className="catalogue sealed-browser"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t("Home")}</Link><span aria-hidden="true">›</span><span aria-current="page">{t(config.title)}</span></nav>
  <div className="section-head"><div><p className="eyebrow">{t(config.eyebrow)}</p><h1 className="sealed-title">{t(config.title)}</h1><p>{t(config.description)}</p></div></div>
  {!!page?.categories.some(c=>c.count>0)&&<div className="shop-section-tabs" role="group" aria-label={t("Product groups")}>{[{handle:'',name:'All',count:0},...page.categories.filter(c=>c.count>0)].map(c=><button key={c.handle} type="button" aria-pressed={category===c.handle} onClick={()=>setCategory(c.handle)}>{t(c.name)}{c.handle?` (${c.count})`:''}</button>)}</div>}
  {loading&&!page&&<CatalogueSkeleton/>}{error&&<p role="alert">{error} <button onClick={()=>setAttempt(value=>value+1)}>{t("Retry")}</button></p>}
  {page&&<section className="sealed-all"><div className="section-head"><h2>{category?t(page.categories.find(c=>c.handle===category)?.name??config.title):t("Newest")}</h2><span>{page.count} {t("options")}</span></div><div className="card-grid sealed-grid">{page.items.map(item=><ProductCard key={item.id} item={item} {...props}/>)}</div>{!page.items.length&&!loading&&<p>{t(query||category?"No products match this selection.":"Products are coming soon.")}</p>}{loading&&page&&<CatalogueSkeleton/>}{!loading&&page.nextOffset!==null&&<button className="button" onClick={()=>setOffset(page.nextOffset!)}>{t("Load more products")}</button>}</section>}
 </section>;
}
export function ShopSectionBrowser(props:Props){return props.home?<HomeRow {...props}/>:<SectionPage {...props}/>;}
