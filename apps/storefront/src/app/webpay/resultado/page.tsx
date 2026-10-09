import type { Metadata } from "next";
import { Suspense } from "react";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Resultado del pago — Banned Cards", robots: { index: false } };
export default function WebpayResultRoute() { return <Suspense><Shop legal="webpay-result" /></Suspense>; }
