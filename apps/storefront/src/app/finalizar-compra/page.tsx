import type { Metadata } from "next";
import { Suspense } from "react";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Finalizar compra — Banned Cards", robots: { index: false } };
export default function CheckoutRoute() { return <Suspense><Shop legal="checkout" /></Suspense>; }
