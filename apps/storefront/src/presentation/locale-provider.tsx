"use client";
import {createContext,useContext,useState} from 'react';
import {spanish} from '@/config/translations';
export type Locale='es'|'en';
const Context=createContext<{locale:Locale;change(locale:Locale):void;t(text:string):string}|null>(null);
export function LocaleProvider({initialLocale,children}:{initialLocale:Locale;children:React.ReactNode}){
 const [locale,setLocale]=useState(initialLocale);
 function change(value:Locale){document.cookie=`storefront-language=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;document.documentElement.lang=value;setLocale(value);}
 return <Context.Provider value={{locale,change,t:text=>locale==='es'?spanish[text]??text:text}}>{children}</Context.Provider>;
}
export function useLocale(){return useContext(Context)!;}
