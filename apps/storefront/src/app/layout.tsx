import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banned Cards — Magic cards",
  description: "A curated marketplace for Magic: The Gathering cards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
