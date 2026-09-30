"use client";
import { useEffect, useRef, useState } from "react";
import { setDirectoryRepository } from "@/adapters/set-directory-repository";
import type { SetPage } from "@/domain/set-directory";
const empty: SetPage = { sets: [], offset: 0, nextOffset: null, previousOffset: null, latestSetCodes: [] };
export function useSetDirectory() {
  const [page, setPage] = useState<SetPage>(empty);
  const [request, setRequest] = useState({ query: "", offset: 0, revision: 0, direction: "none" });
  const [motion, setMotion] = useState({ direction: "none", id: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const busy = useRef(true);
  // Re-read visibility after CMS edits in another tab. Never retain hidden sets.
  useEffect(() => {
    const refresh = () => {
      setPage(previous => ({ ...empty, latestSetCodes: previous.latestSetCodes }));
      setRequest(previous => ({ ...previous, offset: 0, direction: "none", revision: previous.revision + 1 }));
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    busy.current = true; setLoading(true); setError("");
    const timer = setTimeout(() => {
      void setDirectoryRepository.list({ limit: 10, offset: request.offset, query: request.query, signal: controller.signal }).then(result => {
        if (!controller.signal.aborted) {
          setPage(result);
          setMotion(previous => ({ direction: request.direction, id: previous.id + 1 }));
        }
      }).catch(() => { if (!controller.signal.aborted) setError("Unable to load sets. Please retry."); })
        .finally(() => { if (!controller.signal.aborted) { busy.current = false; setLoading(false); } });
    }, request.query && request.direction === "none" ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [request]);
  function navigate(offset: number | null, direction: string) {
    if (busy.current || offset === null) return;
    busy.current = true; setLoading(true);
    setRequest(previous => ({ ...previous, offset, direction }));
  }
  function setSearch(query: string) {
    busy.current = true; setLoading(true);
    setPage(previous => ({ ...empty, latestSetCodes: previous.latestSetCodes }));
    setRequest(previous => ({ ...previous, query, offset: 0, direction: "none" }));
  }
  return { ...page, motion, search: request.query, setSearch, loading, error,
    more: () => navigate(page.nextOffset, "next"), previous: () => navigate(page.previousOffset, "previous"),
    retry: () => setRequest(previous => ({ ...previous, revision: previous.revision + 1 })) };
}
