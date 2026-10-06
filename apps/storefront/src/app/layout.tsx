import {loadStorefrontSettings} from "@/adapters/storefront-settings";
import {SectionsProvider} from "@/presentation/sections-provider";
import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { getTheme, themeStyles } from "@/config/themes";
import { LocaleProvider } from "@/presentation/locale-provider";
import { ThemeProvider } from "@/presentation/theme-provider";

export const metadata: Metadata = {
  title: "Banned Cards — Magic cards",
  description: "A curated marketplace for Magic: The Gathering cards.",
  icons: { icon: [{ url: "/brand/favicon.png", type: "image/png" }], apple: "/brand/logo-symbol.png" },
  openGraph: { images: [{ url: "/brand/logo-square.png", width: 1254, height: 1254, alt: "Banned Cards" }] },
  twitter: { card: "summary", images: ["/brand/logo-square.png"] }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await loadStorefrontSettings();
  const theme = getTheme((await cookies()).get("storefront-theme")?.value);
  const locale=(await cookies()).get("storefront-language")?.value === "en" ? "en" : "es";
  return <html lang={locale} data-theme={theme.id}><head><style dangerouslySetInnerHTML={{__html:themeStyles}} /></head><body><SectionsProvider settings={settings}><LocaleProvider initialLocale={locale}><ThemeProvider initialTheme={theme.id}>{children}</ThemeProvider></LocaleProvider></SectionsProvider></body></html>;
}
