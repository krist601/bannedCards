"use client";
import { createContext, useContext, useState } from "react";
import {useLocale} from "./locale-provider";
import { getTheme, themes } from "@/config/themes";
const ThemeContext = createContext<{theme:string;change(id:string):void} | null>(null);
export function useTheme() { return useContext(ThemeContext)!; }
export function ThemeProvider({ initialTheme, children }: { initialTheme: string; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);
  function change(id: string) {
    const selected = getTheme(id);
    document.documentElement.dataset.theme = selected.id;
    document.cookie = `storefront-theme=${encodeURIComponent(selected.id)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setTheme(selected.id);
  }
  return <ThemeContext.Provider value={{theme,change}}>{children}</ThemeContext.Provider>;
}
export function ThemePicker() {
  const {t}=useLocale();
  const {theme,change} = useContext(ThemeContext)!;
  return <label className="theme-picker"><span className="sr-only">{t("Theme")}</span><select aria-label={t("Theme")} value={theme} onChange={event=>change(event.target.value)}>{themes.map(theme=><option key={theme.id} value={theme.id}>{t(theme.name)}</option>)}</select></label>;
}
