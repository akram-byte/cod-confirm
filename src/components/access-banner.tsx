import { Clock } from "lucide-react";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { getAccess } from "@/lib/access";
import { formatDate } from "@/lib/format";

/** Shown on every dashboard screen in the last days before ACCESS_UNTIL. */
export async function AccessBanner() {
  const access = getAccess();
  if (access.state !== "ending") return null;
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const date = formatDate(access.until, locale);
  const text =
    access.daysLeft <= 1
      ? t.accessBanner.lastDay
      : access.daysLeft === 2
        ? fill(t.accessBanner.twoDays, { date })
        : fill(t.accessBanner.daysLeft, { days: access.daysLeft, date });

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl bg-[var(--pill-warning-bg)] px-4 py-3 text-[15px] text-[var(--pill-warning-ink)]"
    >
      <Clock className="mt-0.5 size-5 shrink-0" />
      <p>
        <span className="font-semibold">{text}</span> {t.accessBanner.after}
      </p>
    </div>
  );
}
