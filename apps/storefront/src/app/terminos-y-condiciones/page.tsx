import type { Metadata } from "next";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Términos y Condiciones — Banned Cards", description: "Condiciones de uso del sitio y de compra en Banned Cards." };
export default function Page() { return <Shop legal="terms" />; }
