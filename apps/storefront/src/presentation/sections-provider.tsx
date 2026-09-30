"use client";
import {createContext,useContext,useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {sectionDefaults,type StorefrontSections} from '@/config/storefront-sections';
const Context=createContext<StorefrontSections>(sectionDefaults);
export function SectionsProvider({settings,children}:{settings:StorefrontSections;children:React.ReactNode}){
 const router=useRouter();
 useEffect(()=>{const refresh=()=>router.refresh();window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[router]);
 return <Context.Provider value={settings}>{children}</Context.Provider>;
}
export const useSections=()=>useContext(Context);
