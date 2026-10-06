"use client";
import Image from "next/image";
import { getTheme } from "@/config/themes";
import { useTheme } from "./theme-provider";

export function BrandLogo({ square = false }: { square?: boolean }) {
  const { theme } = useTheme();
  if (square) return <Image src="/brand/logo-square.png" alt="Banned Cards — Play more. Collect better." width={180} height={180} className="brand-square" />;
  const dark = getTheme(theme).scheme === "dark";
  return <>
    <Image className="brand-horizontal" src={`/brand/logo-horizontal-${dark ? 'white' : 'purple'}.png`} alt="Banned Cards" width={240} height={80} priority />
    <Image className="brand-symbol" src="/brand/logo-symbol.png" alt="Banned Cards" width={56} height={56} />
  </>;
}
