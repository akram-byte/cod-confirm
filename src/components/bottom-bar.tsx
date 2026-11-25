"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useI18n } from "@/i18n/client";
import { navFor, tabFor, type GroupKey } from "@/components/nav";
import { cn } from "@/lib/utils";

const MAIN: GroupKey[] = ["today", "confirmation", "delivery"];

/**
 * Phone only: the three daily places as big buttons at the bottom, in thumb reach,
 * and "More" for the full menu (customers, settings, language, logout).
 */
export function BottomBar({ toConfirm, toRescue, caller = false }: { toConfirm: number; toRescue: number; caller?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const group = tabFor(pathname).group;
  const badge: Partial<Record<GroupKey, number>> = { confirmation: toConfirm, delivery: toRescue };
  const cell =
    "relative flex flex-1 flex-col items-center justify-center gap-1 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:bg-muted";

  return (
    <nav
      aria-label={t.nav.menu}
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-16">
        {navFor(caller).filter((n) => MAIN.includes(n.key)).map((n) => {
          const on = n.key === group;
          const count = badge[n.key] ?? 0;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cn(cell, on ? "text-primary" : "text-muted-foreground")}
            >
              <span className="relative">
                <n.icon className="size-6" strokeWidth={on ? 2.2 : 1.8} />
                {count > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -end-3 min-w-5 rounded-full px-1 text-center text-[11px] leading-5 font-semibold text-white tabular-nums",
                      n.key === "delivery" ? "bg-destructive" : "bg-primary",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              {t.nav[n.key]}
            </Link>
          );
        })}
        <button
          type="button"
          // Stop the tap here: otherwise the drawer sees this same tap as "outside" and closes again.
          onClick={(e) => {
            e.stopPropagation();
            setOpenMobile(true);
          }}
          className={cn(cell, !MAIN.includes(group) ? "text-primary" : "text-muted-foreground")}
        >
          <Menu className="size-6" strokeWidth={1.8} />
          {t.nav.more}
        </button>
      </div>
    </nav>
  );
}
