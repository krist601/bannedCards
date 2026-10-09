import type { Metadata } from "next";
import { GoogleCallback } from "@/presentation/google-callback";
export const metadata: Metadata = { title: "Iniciando sesión — Banned Cards", robots: { index: false } };
export default function GoogleCallbackRoute() { return <GoogleCallback />; }
