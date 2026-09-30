"use client";
import {useEffect,useRef,useState} from 'react';
import {ThemePicker} from './theme-provider';
import {useLocale} from './locale-provider';
export function ShopMenu({customer,onAccount}:{customer:string;onAccount():void}){
 const {t,locale,change}=useLocale();const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;function click(event:PointerEvent){if(!root.current?.contains(event.target as Node))setOpen(false);}function key(event:KeyboardEvent){if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}}document.addEventListener('pointerdown',click);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',click);document.removeEventListener('keydown',key);};},[open]);
 return <div className="shop-menu" ref={root}><button ref={trigger} className="menu-trigger" aria-label={t('Menu')} aria-expanded={open} aria-controls="shop-preferences" onClick={()=>setOpen(value=>!value)}><span aria-hidden="true">☰</span></button>{open&&<div id="shop-preferences" className="menu-panel"><label>{t('Theme')}</label><ThemePicker/><label htmlFor="site-language">{t('Language')}</label><select id="site-language" value={locale} onChange={event=>change(event.target.value==='en'?'en':'es')}><option value="es">Español</option><option value="en">English</option></select><button className="account-menu-button" onClick={()=>{setOpen(false);onAccount();}}>{t(customer?'Profile':'Log in')}</button></div>}</div>;
}
