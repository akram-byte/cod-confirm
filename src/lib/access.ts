// Trial / paid-until date for this install, from ACCESS_UNTIL (YYYY-MM-DD, last day included).
// Empty = no limit. After the date the dashboard is locked, but the public order form keeps
// taking orders, so the seller never loses a customer. Pure code: also used by the proxy.

export type Access =
  | { state: "open"; until: null; daysLeft: null }
  | { state: "active" | "ending"; until: Date; daysLeft: number }
  | { state: "ended"; until: Date; daysLeft: 0 };

/** Days before the end when the dashboard starts showing a reminder. */
export const ENDING_SOON_DAYS = 3;

const DAY = 24 * 60 * 60 * 1000;
// Algeria is UTC+1 all year (no daylight saving).
const ALGIERS_OFFSET = 60 * 60 * 1000;

/** The moment access stops: midnight in Algiers at the end of the given day. */
export function parseAccessUntil(value: string | undefined): Date | null {
  const m = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    if (value?.trim()) console.warn(`ACCESS_UNTIL="${value}" is not a YYYY-MM-DD date; access is not limited.`);
    return null;
  }
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1) - ALGIERS_OFFSET);
}

export function getAccess(now = new Date(), value = process.env.ACCESS_UNTIL): Access {
  const end = parseAccessUntil(value);
  if (!end) return { state: "open", until: null, daysLeft: null };
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { state: "ended", until: lastDay(end), daysLeft: 0 };
  const daysLeft = Math.ceil(ms / DAY);
  return { state: daysLeft <= ENDING_SOON_DAYS ? "ending" : "active", until: lastDay(end), daysLeft };
}

/** Noon (Algiers) on the last included day, safe to format as a date in any timezone near Algeria. */
function lastDay(end: Date) {
  return new Date(end.getTime() - 12 * 60 * 60 * 1000);
}
