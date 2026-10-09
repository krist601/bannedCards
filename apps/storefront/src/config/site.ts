/** Public business details used by the footer and the legal pages. Override with the NEXT_PUBLIC_* variables. */
export const siteName = "Banned Cards";
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@bannedcards.cl";
export const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/bannedcards.cl/";
export const instagramHandle = "@" + (instagramUrl.replace(/\/+$/, "").split("/").pop() || "bannedcards.cl");
/** Names shown in the footer and in the legal texts. Keep them in sync with the providers you really use. */
export const paymentProviders = ["Webpay (Transbank)"];
export const shippingProviders = ["Starken"];
export const privacyPolicyPath = "/politica-de-privacidad";
export const pagePaths = { about: "/acerca-de-nosotros", terms: "/terminos-y-condiciones", contact: "/contacto", privacy: privacyPolicyPath } as const;
export const joinNames = (names: string[], locale: "es" | "en") => names.length < 2 ? names.join("") : names.slice(0, -1).join(", ") + (locale === "en" ? " and " : " y ") + names[names.length - 1];
export const accountPath = "/mi-cuenta";
