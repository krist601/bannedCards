import type { Metadata } from "next";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Contacto — Banned Cards", description: "Escríbenos: consultas sobre pedidos, cartas y venta de colecciones." };
export default function Page() { return <Shop legal="contact" />; }
