export const LOCALES = ["ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Replaces {key} placeholders: fill("Page {page}", { page: 2 }). */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}
