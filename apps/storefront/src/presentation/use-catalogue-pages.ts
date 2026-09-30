"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadCataloguePage, type CatalogueQuery } from "@/adapters/catalogue-page-repository";
import type { CatalogueItem } from "@/domain/commerce";
const empty = { cards: [] as CatalogueItem[], count: 0, nextOffset: null as number | null, loading: true, error: "" };
export function useCataloguePages(query: CatalogueQuery, enabled: boolean) {
  const key = JSON.stringify(query);
  const [state, setState] = useState({...empty, key:""});
  const active = useRef<{key:string; controller:AbortController; busy:boolean; offset:number} | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const fetchPage = useCallback(async (run: NonNullable<typeof active.current>, offset:number) => {
    if (run.busy || run.controller.signal.aborted) return;
    run.busy=true; run.offset=offset;
    setState(previous=>({...previous,key:run.key,loading:true,error:""}));
    try {
      const page = await loadCataloguePage(JSON.parse(run.key),offset,run.controller.signal);
      if (active.current !== run || run.controller.signal.aborted) return;
      setState(previous=>({...page,key:run.key,loading:false,error:"",cards:offset===0?page.cards:[...new Map([...previous.cards,...page.cards].map(card=>[card.id,card])).values()]}));
    } catch(error) {
      if (!run.controller.signal.aborted && active.current===run) setState(previous=>({...previous,loading:false,error:error instanceof Error?error.message:'Unable to load cards.'}));
    } finally {run.busy=false;}
  },[]);
  useEffect(()=>{
    const run={key,controller:new AbortController(),busy:false,offset:0}; active.current=run;
    setState({...empty,key});
    const timer=window.setTimeout(()=>{if(enabled) void fetchPage(run,0);},JSON.parse(key).q?250:0);
    return ()=>{clearTimeout(timer);run.controller.abort();};
  },[key,enabled,fetchPage]);
  const more=useCallback(()=>{
    const run=active.current;
    if(run && run.key===key && state.key===key && !state.loading && enabled && !state.error && state.nextOffset!==null) void fetchPage(run,state.nextOffset);
  },[key,enabled,state.key,state.loading,state.error,state.nextOffset,fetchPage]);
  useEffect(()=>{
    if(!sentinel.current || state.loading || state.error || !enabled || state.nextOffset===null) return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)) more();},{rootMargin:'400px'});
    observer.observe(sentinel.current);return()=>observer.disconnect();
  },[more,state.loading,state.error,state.nextOffset,enabled]);
  return {...(state.key===key?state:empty),sentinel,more,retry:()=>{const run=active.current;if(run && enabled) void fetchPage(run,run.offset);}};
}
