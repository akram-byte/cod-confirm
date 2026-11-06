import "server-only";
import { WILAYAS, wilayaLabel } from "@/lib/algeria";
import type { Locale } from "@/i18n/config";

export type WilayaOption = { code: number; label: string; communes: { id: number; name: string }[] };

/** Wilayas + communes in one language, for client-side selects. */
export function wilayaOptions(locale: Locale, onlyCodes?: Set<number>): WilayaOption[] {
  return WILAYAS.filter((w) => !onlyCodes || onlyCodes.has(w.code)).map((w) => ({
    code: w.code,
    label: wilayaLabel(w, locale),
    communes: w.communes
      .map((c) => ({ id: c.id, name: locale === "ar" ? c.nameAr : c.nameFr }))
      .sort((a, b) => a.name.localeCompare(b.name, locale)),
  }));
}
