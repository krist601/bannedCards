"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { BulkAllocation } from "@/application/bulk-cards";
import type { Cart, CatalogueItem } from "@/domain/commerce";
import { HeroBanner } from "./hero-banner";
const BulkFinderDialog = dynamic(() => import("./bulk-finder-dialog").then(m => m.BulkFinderDialog));
type Props={featuredCards?:CatalogueItem[];cardCount?:number|null;onFilter?:(kind:"added"|"latest"|"all")=>void;sealedEnabled?:boolean;singlesEnabled?:boolean;customEnabled?:boolean;accessoriesEnabled?:boolean;bulkEnabled?:boolean;openRequest?:number;hideBanner?:boolean;home?:boolean;cart:Cart;disabled:boolean;onAdd(entries:BulkAllocation[]):Promise<{success:boolean;added:BulkAllocation[]}>;onOpenCart():void};
export function HeroCarousel({featuredCards=[],cardCount=null,onFilter,cart,disabled,onAdd,onOpenCart,sealedEnabled=true,singlesEnabled=true,customEnabled=false,accessoriesEnabled=false,bulkEnabled=true,home=false,openRequest=0,hideBanner=false}:Props){
  const [open,setOpen]=useState(false);
  // The dialog chunk loads on first open and then stays mounted, so the pasted list and results survive close/reopen.
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{if(openRequest>0)setOpen(true);},[openRequest]);
  useEffect(()=>{if(open)setLoaded(true);},[open]);
  return <>{!hideBanner&&<HeroBanner home={home} enabled={{singles:singlesEnabled,sealed:sealedEnabled,custom:customEnabled,accessories:accessoriesEnabled,bulk:bulkEnabled}} featuredCards={featuredCards} cardCount={cardCount} onOpenBulk={()=>setOpen(true)} onFilter={onFilter} />}
  {(loaded||open)&&<BulkFinderDialog open={open} onClose={()=>setOpen(false)} cart={cart} disabled={disabled} onAdd={onAdd} onOpenCart={onOpenCart} />}</>;
}
