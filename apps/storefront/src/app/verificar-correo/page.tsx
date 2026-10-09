import type { Metadata } from "next";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Confirmar correo — Banned Cards", robots: { index: false } };
export default function VerifyEmailPage() { return <Shop legal="verify-email" />; }
