import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { getTheme, themeStyles } from "@/config/themes";
import { ThemeProvider } from "@/presentation/theme-provider";

export const metadata: Metadata = {
  title: "Banned Cards — Magic cards",
  description: "A curated marketplace for Magic: The Gathering cards."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = getTheme((await cookies()).get("storefront-theme")?.value);
  return <html lang="en" data-theme={theme.id}><head><style dangerouslySetInnerHTML={{__html:themeStyles}} /></head><body><ThemeProvider initialTheme={theme.id}>{children}</ThemeProvider></body></html>;
}
