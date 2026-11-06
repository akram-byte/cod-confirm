import type { Locale } from "@/i18n/config";

// Algeria is UTC+1 all year (no DST).
export const TIME_ZONE = "Africa/Algiers";
export const TZ_OFFSET = "+01:00";

function intlLocale(locale: Locale) {
  return locale === "ar" ? "ar-DZ-u-nu-latn" : "fr-DZ";
}

export function formatDateTime(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** "2026-11-06" (Algiers day) → Date at local midnight. */
export function startOfDay(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00${TZ_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}
