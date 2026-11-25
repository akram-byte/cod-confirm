import { CalendarCheck, PhoneCall, Users, Truck, Settings, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/i18n/ar";

export type NavKey = keyof Dictionary["pages"];
export type GroupKey = "today" | "confirmation" | "delivery" | "customers" | "settings";
export type TabKey = NavKey | "abandoned";

/**
 * Five places in the menu. Pages that belong together are tabs inside one place,
 * so the owner never has to guess where something lives.
 */
export const NAV: { key: GroupKey; href: string; icon: LucideIcon; tabs: { key: TabKey; href: string }[] }[] = [
  {
    key: "today",
    href: "/",
    icon: CalendarCheck,
    tabs: [
      { key: "dashboard", href: "/" },
      { key: "stats", href: "/stats" },
    ],
  },
  {
    key: "confirmation",
    href: "/confirmation",
    icon: PhoneCall,
    tabs: [
      { key: "confirmation", href: "/confirmation" },
      { key: "abandoned", href: "/confirmation/abandoned" },
      { key: "orders", href: "/orders" },
    ],
  },
  {
    key: "delivery",
    href: "/delivery",
    icon: Truck,
    tabs: [
      { key: "delivery", href: "/delivery" },
      { key: "rescue", href: "/rescue" },
      { key: "cash", href: "/cash" },
    ],
  },
  { key: "customers", href: "/customers", icon: Users, tabs: [{ key: "customers", href: "/customers" }] },
  { key: "settings", href: "/settings", icon: Settings, tabs: [{ key: "settings", href: "/settings" }] },
];

/** The caller login (calls customers only): the call queue, abandoned orders and "Save the parcel". */
const CALLER_NAV: typeof NAV = [
  {
    key: "confirmation",
    href: "/confirmation",
    icon: PhoneCall,
    tabs: [
      { key: "confirmation", href: "/confirmation" },
      { key: "abandoned", href: "/confirmation/abandoned" },
    ],
  },
  { key: "delivery", href: "/rescue", icon: Truck, tabs: [{ key: "rescue", href: "/rescue" }] },
];

export function navFor(caller: boolean) {
  return caller ? CALLER_NAV : NAV;
}

const under = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

/** The tab the pathname is on: the longest matching tab link wins ("/confirmation/abandoned" over "/confirmation"). */
export function tabFor(pathname: string): { group: GroupKey; tab: TabKey } {
  let best: { group: GroupKey; tab: TabKey; len: number } = { group: "today", tab: "dashboard", len: 0 };
  for (const g of NAV) {
    for (const t of g.tabs) {
      if (t.href !== "/" && under(pathname, t.href) && t.href.length > best.len) {
        best = { group: g.key, tab: t.key, len: t.href.length };
      }
    }
  }
  return { group: best.group, tab: best.tab };
}

/** The page whose title names this screen (the phone header). */
export function navKeyFor(pathname: string): NavKey {
  const { tab } = tabFor(pathname);
  return tab === "abandoned" ? "confirmation" : tab;
}
