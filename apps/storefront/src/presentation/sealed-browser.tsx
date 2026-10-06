"use client";
import {useSections} from "./sections-provider";
import {useLocale} from "./locale-provider";
import {CatalogueSkeleton} from "./catalogue-skeleton";
import Link from 'next/link';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {CatalogueItem,Cart} from '@/domain/commerce';
import {sealedCategories,sealedCollections,type SealedView} from '@/config/sealed';
import {CardImage} from './card-image';
import {BannerProductImage} from './banner-product-image';
type Props={query:string;cart:Cart;disabled:boolean;onAdd(item:CatalogueItem):void;home?:boolean;view?:SealedView;initialLanguage?:string};
type Banner={categories:string[];image?:string;background?:string;color?:string;set:string};
type Page={items:CatalogueItem[];count:number;nextOffset:number|null;languages:string[];sets:{slug:string;name:string;images?:{src:string;name:string}[];image?:string;background?:string;color?:string}[];banners:Banner[];rows:Record<string,CatalogueItem[]>};
const money=(value:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value);
function SealedCard({item,cart,disabled,onAdd}:Pick<Props,'cart'|'disabled'|'onAdd'>&{item:CatalogueItem}){
 const {t}=useLocale();
  const quantity=cart.find(line=>line.id===item.id)?.quantity??0;
  const original=Number(item.attributes?.originalPrice);
  return <article className="product sealed-product"><div className="sealed-image"><CardImage item={item}/></div><div className="product-details"><small>{item.set||'Factory sealed'}</small>{item.attributes?.demoInventory==='true'&&<small className="sample-stock">{t("Sample price & stock")}</small>}<h3>{item.name}</h3><p>{t("Language")}: {t(item.attributes?.language??"Unspecified")}</p><div className="sealed-purchase"><strong>{item.price===null?t("Price unavailable"):<>{original>item.price&&<del>{money(original)} </del>}{money(item.price)}</>}</strong><button disabled={disabled||item.price===null||(item.stock!==null&&quantity>=item.stock)} onClick={()=>onAdd(item)}>{t("Add")}</button></div><p>{item.stock===0?t("Out of stock"):item.stock===null?t("Available"):`${item.stock} ${t("in stock")}`}{quantity>0?` · ${quantity} ${t("in cart")}`:''}</p></div></article>;
}
function ProductRow({title,items,href,...props}:Pick<Props,'cart'|'disabled'|'onAdd'>&{title:string;items:CatalogueItem[];href:string}){
 const {t}=useLocale();
  const track=useRef<HTMLDivElement>(null);
  return <section className="sealed-row"><div className="section-head"><h2>{t(title)}</h2><div className="row-controls"><button aria-label={`Scroll ${t(title)} left`} onClick={()=>track.current?.scrollBy({left:-track.current.clientWidth,behavior:'smooth'})}>←</button><button aria-label={`Scroll ${t(title)} right`} onClick={()=>track.current?.scrollBy({left:track.current.clientWidth,behavior:'smooth'})}>→</button></div></div>{!items.length&&<p className="row-empty">{title==='Deals'?t("No deals available right now."):title==='Almost gone'?t("No products are running low right now."):t("Products are coming soon.")}</p>}<div className="product-track" ref={track}>{items.slice(0,10).map(item=><SealedCard key={item.id} item={item} {...props}/>)}<Link className="more-tile" href={href}><span>{t("Explore more")}</span><strong>{t(title)} →</strong></Link></div></section>;
}
type Slide={images?:{src:string;name:string}[];title:string;description?:string;href:string;image?:string;background?:string;color?:string;set?:string};
function BrowseCarousel({title,slides}:{title:string;slides:Slide[]}){
 const {t}=useLocale();
  const [index,setIndex]=useState(0);
  const active=slides[index%Math.max(slides.length,1)];
  if(!active)return null;
  return <section className="browse-carousel set-hero" aria-label={t(title)} aria-roledescription="carousel"><div className="set-carousel-controls"><div className="row-controls"><button aria-label={`Previous ${t(title)} banner`} onClick={()=>setIndex(value=>(value-1+slides.length)%slides.length)}>←</button><span>{index%slides.length+1} / {slides.length}</span><button aria-label={`Next ${t(title)} banner`} onClick={()=>setIndex(value=>(value+1)%slides.length)}>→</button></div></div><div className="browse-slide" style={{'--banner-color':'var(--primary)'} as CSSProperties}>
{active.background&&<img className="browse-background" src={active.background} alt=""/>}<div className="browse-shape"/><div className="browse-copy"><p className="eyebrow">{active.set||'Magic: The Gathering'}</p><h3>{active.title}</h3>{active.description&&<p>{active.description}</p>}<Link className="button" href={active.href}>{t("Explore")} {active.title} →</Link></div><div className={`browse-cutout ${active.images?.length?"browse-product-group":""}`}>{active.images?.length?active.images.map(image=><BannerProductImage key={image.src} src={image.src} name={image.name}/>):active.image?<BannerProductImage key={active.image} src={active.image} name={active.title}/>:<div className="package-placeholder" aria-hidden="true"><span>BANNED CARDS</span><strong>{active.title}</strong></div>}</div></div></section>;
}
function CategoryRow({banners}:{banners:Banner[]}) {
 const {t}=useLocale();
  const track=useRef<HTMLDivElement>(null);
  return <section className="sealed-row"><div className="section-head"><h2>{t("Shop by product")}</h2><div className="row-controls"><button aria-label="Scroll categories left" onClick={()=>track.current?.scrollBy({left:-track.current.clientWidth,behavior:'smooth'})}>←</button><button aria-label="Scroll categories right" onClick={()=>track.current?.scrollBy({left:track.current.clientWidth,behavior:'smooth'})}>→</button></div></div><div className="product-track category-track" ref={track}>{sealedCategories.map(category=>{
    const banner=banners.find(b=>b.categories.includes(category.slug));
    return <Link className={`category-tile category-${category.slug}`} key={category.slug} href={`/sealed/${category.slug}`}><div className="category-art">{banner?.image?<img src={banner.image} alt=""/>:<div className="package-placeholder" aria-hidden="true"><span>BANNED CARDS</span><strong>{t(category.name)}</strong></div>}</div><h3>{t(category.name)}</h3><p>{t(category.description)}</p><strong>{t("Explore →")}</strong></Link>;
  })}</div></section>;
}
export function SealedBrowser(props:Props){
  const {query,home=false,view={}}=props;
  const [language,setLanguage]=useState(props.initialLanguage??'');
  return <section id="sealed" className={`catalogue sealed-browser ${!home&&!view.category&&!view.set&&!view.collection&&!query?"sealed-overview":""}`}><SealedContent key={JSON.stringify([query,view,language])} {...props} language={language} onLanguage={setLanguage} home={home}/></section>;
}
function SealedContent(props:Props&{language:string;onLanguage(value:string):void}){
 const sections=useSections();
 const {t}=useLocale();
  const {query,home,view={},language,onLanguage}=props;
  const [page,setPage]=useState<Page|null>(null),[offset,setOffset]=useState(0),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const key=JSON.stringify({q:query,...view,language});
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');const timer=setTimeout(()=>{
    fetch(`/api/sealed?${new URLSearchParams({...JSON.parse(key),offset:String(offset)})}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('Unable to load sealed products. Please retry.');return response.json() as Promise<Page>;}).then(next=>{if(!controller.signal.aborted){setPage(previous=>offset===0?next:{...next,items:[...(previous?.items??[]),...next.items],rows:previous?.rows??{}});setLoading(false);}}).catch(error=>{if(!controller.signal.aborted){setError(error.message);setLoading(false);}});
  },query?250:0);return()=>{clearTimeout(timer);controller.abort();};},[key,offset,attempt,query]);
  const category=sealedCategories.find(c=>c.slug===view.category);
  const set=page?.sets.find(s=>s.slug===view.set);
  const title=category?.name||set?.name||(view.set?view.set.replace(/-/g,' '):undefined)||(view.collection?sealedCollections[view.collection as keyof typeof sealedCollections]:undefined)||'Sealed products';
  const overview=!view.category&&!view.set&&!view.collection&&!query;
  const rowHref=(collection:string)=>`/sealed/collections/${collection}${language?`?language=${encodeURIComponent(language)}`:''}`;
  return <>
    {!home&&!overview&&<><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t("Home")}</Link><span aria-hidden="true">›</span>{overview?<span aria-current="page">{t("Sealed products")}</span>:<><Link href="/sealed">{t("Sealed products")}</Link><span aria-hidden="true">›</span><span aria-current="page">{t(title)}</span></>}</nav><div className="section-head"><div><p className="eyebrow">{t("Find your next opening")}</p><h1 className="sealed-title">{t(title)}</h1></div><label className="language-filter">{t("Language")}<select value={language} onChange={e=>onLanguage(e.target.value)}><option value="">{t("All languages")}</option>{[...new Set([...(page?.languages??[]),...(language?[language]:[])])].map(value=><option key={value}>{value}</option>)}</select></label></div></>}
    {loading&&!page&&<CatalogueSkeleton hero={!home&&overview} row={home}/>}{error&&<p role="alert">{error} <button onClick={()=>setAttempt(value=>value+1)}>{t("Retry")}</button></p>}
    {page&&<>{home?<ProductRow title="Latest sealed releases" items={page.rows['latest-releases']??[]} href="/sealed/collections/latest-releases" {...props}/>:<>
      {overview&&<>{sections.sealedBanner&&<BrowseCarousel title="Shop by set" slides={page.sets.slice(0,5).map(set=>({title:set.name,href:`/sealed/sets/${set.slug}`,images:set.images,image:set.image,background:set.background,color:set.color}))}/>} {sections.sealedCategories&&<CategoryRow banners={page.banners}/>}{Object.entries(sealedCollections).filter(([slug])=>slug==='latest-releases'?sections.sealedLatest:slug==='almost-gone'?sections.sealedAlmostGone:slug==='deals'?sections.sealedDeals:false).map(([slug,title])=><ProductRow key={slug} title={title} items={page.rows[slug]??[]} href={rowHref(slug)} {...props}/>)}</>}
      {(!overview||sections.sealedNew)&&<section className="sealed-all"><div className="section-head"><h2>{overview?t("Newest"):t(title)}</h2><span>{page.count} options</span></div><div className="card-grid sealed-grid">{page.items.map(item=><SealedCard key={item.id} item={item} {...props}/>)}</div>{!page.items.length&&<p>{t("No products match this selection.")}</p>}{loading&&<CatalogueSkeleton/>}{!loading&&page.nextOffset!==null&&<button className="button" onClick={()=>setOffset(page.nextOffset!)}>{t("Load more products")}</button>}</section>}
    </>}</>}
  </>;
}
