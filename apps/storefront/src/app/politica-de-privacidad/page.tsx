import type { Metadata } from "next";
import { Shop } from "@/presentation/shop";
export const metadata: Metadata = { title: "Política de Privacidad — Banned Cards", description: "Cómo Banned Cards recopila, usa y protege tus datos personales." };
export default function PrivacyPolicyPage() { return <Shop legal="privacy" />; }
