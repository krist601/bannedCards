import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {SectionsProvider} from "@/presentation/sections-provider";
import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { preconnect } from "react-dom";
import { getTheme, themeStyles } from "@/config/themes";
import { LocaleProvider } from "@/presentation/locale-provider";
import { ThemeProvider } from "@/presentation/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://bannedcards.cl"),
  title: "Banned Cards — Magic cards",
  description: "A curated marketplace for Magic: The Gathering cards.",
  icons: { icon: [{ url: "/brand/favicon-48.png", type: "image/png", sizes: "48x48" }], apple: "/brand/apple-touch-icon.png" },
  openGraph: { images: [{ url: "/brand/og-square.jpg", width: 600, height: 600, alt: "Banned Cards" }] },
  twitter: { card: "summary", images: ["/brand/og-square.jpg"] }
};

function originOf(value?: string) { try { return value ? new URL(value).origin : undefined; } catch { return undefined; } }

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = process.env.NEXT_PUBLIC_COMMERCE_MODE === "demo";
  const imageOrigin = demo ? "https://cards.scryfall.io" : originOf(process.env.IMAGE_ORIGIN);
  const apiOrigin = demo ? undefined : originOf(process.env.NEXT_PUBLIC_MEDUSA_URL);
  if (imageOrigin) preconnect(imageOrigin);
  if (apiOrigin) { preconnect(apiOrigin); preconnect(apiOrigin, { crossOrigin: "anonymous" }); }
  const settings = await loadStorefrontSettings();
  const theme = getTheme((await cookies()).get("storefront-theme")?.value);
  const locale=(await cookies()).get("storefront-language")?.value === "en" ? "en" : "es";
  return <html lang={locale} data-theme={theme.id}><head><style dangerouslySetInnerHTML={{__html:themeStyles}} /></head><body><SectionsProvider settings={settings}><LocaleProvider initialLocale={locale}><ThemeProvider initialTheme={theme.id}>{children}</ThemeProvider></LocaleProvider></SectionsProvider></body></html>;
}
