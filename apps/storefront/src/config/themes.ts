/** Add another entry here; it automatically appears in the theme picker.
 * Use CSS colors for palette values. Keep foreground/background pairs readable.
 */
export type Theme = {
  id: string; name: string; scheme: "dark" | "light";
  colors: { background: string; surface: string; primary: string; accent: string; text: string; muted: string; border: string; onPrimary: string; onAccent: string; link: string };
};
export const themes: Theme[] = [
  { id: "dark", name: "Dark", scheme: "dark", colors: {
    background: "#0F1115", surface: "#181B22", primary: "#7C3AED", accent: "#F59E0B",
    text: "#F5F5F5", muted: "#9CA3AF", border: "#2A2E38",
    onPrimary: "#FFFFFF", onAccent: "#17120A", link: "#B99AFB"
  } },
  { id: "light", name: "Light", scheme: "light", colors: {
    background: "#F5F3FA", surface: "#FFFFFF", primary: "#6D28D9", accent: "#F59E0B",
    text: "#1C1729", muted: "#655D73", border: "#D9D3E4",
    onPrimary: "#FFFFFF", onAccent: "#17120A", link: "#6D28D9"
  } }
];
export const defaultTheme = "dark";
export function getTheme(id?: string) { return themes.find(theme => theme.id === id) ?? themes.find(theme => theme.id === defaultTheme)!; }
const cssName = (name: string) => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
export const themeStyles = themes.map(theme => `${theme.id === defaultTheme ? ':root,' : ''}:root[data-theme="${theme.id}"]{color-scheme:${theme.scheme};${Object.entries(theme.colors).map(([name,value])=>`--${cssName(name)}:${value};`).join('')}--icon-filter:${theme.scheme === 'dark' ? 'invert(1)' : 'none'};}`).join('\n');
