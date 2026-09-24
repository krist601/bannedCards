"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createCommerceRepositories, demoMode } from "@/adapters/commerce-repositories";
import type { CommerceRepositories } from "@/application/ports";
import type { BulkAllocation } from "@/application/bulk-cards";
import type { Cart, CatalogueItem } from "@/domain/commerce";

/** Driving adapter: coordinates async ports and view state, never vendor API calls. */
export function useCommerce() {
  const repositories = useRef<CommerceRepositories | null>(null);
  const locked = useRef(false);
  const [cart, setCart] = useState<Cart>([]);
  const [customer, setCustomer] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const report = (error: unknown) => setError(error instanceof Error ? error.message : "Unable to contact the store.");
  const initialize = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    setLoading(true); setError(""); setReady(false);
    try {
      const ports = repositories.current ?? createCommerceRepositories();
      repositories.current = ports;
      const [savedCart, session] = await Promise.all([ports.cart.load(), ports.customer.load()]);
      setCart(savedCart); setCustomer(session); setReady(true);
    } catch (error) { report(error); }
    finally { locked.current = false; setLoading(false); }
  }, []);
  useEffect(() => { void initialize(); }, [initialize]);
  async function run(action: (ports: CommerceRepositories) => Promise<void>) {
    if (locked.current || !ready || !repositories.current) return false;
    locked.current = true; setBusy(true); setError("");
    try { await action(repositories.current); return true; }
    catch (error) { report(error); return false; }
    finally { locked.current = false; setBusy(false); }
  }
  return {
    cart, customer, loading, busy, error, demoMode, disabled: loading || busy || !ready,
    retry: initialize,
    add: (item: CatalogueItem) => run(async ports => { setCart(await ports.cart.add(item)); }),
    addBulk: async (entries: BulkAllocation[]) => {
      const added: BulkAllocation[] = [];
      const success = await run(async ports => {
        let current = await ports.cart.load(); setCart(current);
        for (const entry of entries) {
          const existing = current.find(line => line.id === entry.card.id)?.quantity ?? 0;
          if (entry.card.stock !== null && existing + entry.quantity > entry.card.stock) throw new Error(`Stock changed for ${entry.card.name}. Check your list again.`);
          current = await ports.cart.add(entry.card, entry.quantity);
          setCart(current); added.push(entry);
        }
      });
      return { success, added };
    },
    quantity: (id: string, value: number) => run(async ports => { setCart(await ports.cart.setQuantity(id, value)); }),
    login: (email: string, password: string) => run(async ports => { setCustomer(await ports.customer.login(email, password)); }),
    logout: () => run(async ports => {
      await ports.customer.clear();
      ports.cart.clearLocal(); setCustomer(""); setCart([]);
    })
  };
}
