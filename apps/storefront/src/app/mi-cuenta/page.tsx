import type { Metadata } from "next";
import { Suspense } from "react";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Mi cuenta — Banned Cards", robots: { index: false } };
export default function AccountRoute() { return <Suspense><Shop legal="account" /></Suspense>; }
