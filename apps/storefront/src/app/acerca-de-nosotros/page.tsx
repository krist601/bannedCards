import type { Metadata } from "next";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Acerca de nosotros — Banned Cards", description: "Conoce a Banned Cards, tienda en línea de cartas coleccionables de Magic: The Gathering en Chile." };
export default function Page() { return <Shop legal="about" />; }
