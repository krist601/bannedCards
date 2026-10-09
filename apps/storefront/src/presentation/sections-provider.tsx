"use client";
import {createContext,useContext,useEffect,useRef} from 'react';
import {useRouter} from 'next/navigation';
import {sectionDefaults,type StorefrontSections} from '@/config/storefront-sections';
const Context=createContext<StorefrontSections>(sectionDefaults);
export function SectionsProvider({settings,children}:{settings:StorefrontSections;children:React.ReactNode}){
 const router=useRouter();
 const last=useRef(0);
 useEffect(()=>{last.current=Date.now();const refresh=()=>{if(document.hidden||Date.now()-last.current<60000)return;last.current=Date.now();router.refresh();};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[router]);
 return <Context.Provider value={settings}>{children}</Context.Provider>;
}
export const useSections=()=>useContext(Context);
