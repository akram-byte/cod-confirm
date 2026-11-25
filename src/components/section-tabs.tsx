"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import type { Dictionary } from "@/i18n/ar";
import { navFor, tabFor, type TabKey } from "@/components/nav";
import { cn } from "@/lib/utils";

/** Each tab's words: short, plain, and saying what is inside. */
export function tabLabel(t: Dictionary, key: TabKey) {
  const labels: Record<TabKey, string> = {
    dashboard: t.nav.today,
    stats: t.nav.stats,
    confirmation: t.nav.toCall,
    abandoned: t.nav.abandoned,
    orders: t.nav.allOrders,
    delivery: t.nav.parcels,
    rescue: t.nav.rescue,
    cash: t.nav.cash,
    customers: t.nav.customers,
    settings: t.nav.settings,
  };
  return labels[key];
}

/**
 * The pages inside one menu place, as big tabs above the screen.
 * Hidden for places with a single page.
 */
export function SectionTabs({ counts, caller = false }: { counts: Partial<Record<TabKey, number>>; caller?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { group, tab } = tabFor(pathname);
  const tabs = navFor(caller).find((g) => g.key === group)?.tabs ?? [];
  if (tabs.length < 2) return null;

  return (
    <nav aria-label={t.nav.sections} className="-mx-4 mb-6 overflow-x-auto border-b px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <ul className="flex gap-1">
        {tabs.map((it) => {
          const on = it.key === tab;
          const count = counts[it.key] ?? 0;
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:bg-muted",
                  on ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tabLabel(t, it.key)}
                {count > 0 && (
                  <span
                    className={cn(
                      "min-w-6 rounded-full px-1.5 text-center text-xs leading-5 font-semibold tabular-nums",
                      it.key === "rescue" ? "bg-destructive text-white" : "bg-primary text-primary-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
