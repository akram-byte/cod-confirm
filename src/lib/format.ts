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

export function formatPercent(value: number | null, locale: Locale) {
  if (value === null) return "—";
  return new Intl.NumberFormat(intlLocale(locale), { style: "percent", maximumFractionDigits: 1 }).format(value);
}

/** "3 h", "2 j" style elapsed time, in the dashboard language. */
export function formatAgo(date: Date, locale: Locale, now = new Date()) {
  const min = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  const fmt = (n: number, unit: "minute" | "hour" | "day") =>
    new Intl.NumberFormat(intlLocale(locale), { style: "unit", unit, unitDisplay: "narrow" }).format(n);
  if (min < 60) return fmt(min, "minute");
  if (min < 48 * 60) return fmt(Math.floor(min / 60), "hour");
  return fmt(Math.floor(min / 1440), "day");
}
