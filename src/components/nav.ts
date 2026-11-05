import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Users,
  Truck,
  ChartColumn,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/i18n/ar";

export type NavKey = keyof Dictionary["pages"];

export const NAV: { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "orders", href: "/orders", icon: ShoppingBag },
  { key: "confirmation", href: "/confirmation", icon: PhoneCall },
  { key: "customers", href: "/customers", icon: Users },
  { key: "delivery", href: "/delivery", icon: Truck },
  { key: "stats", href: "/stats", icon: ChartColumn },
  { key: "settings", href: "/settings", icon: Settings },
];

export function navKeyFor(pathname: string): NavKey {
  const match = NAV.filter((n) => n.href !== "/").find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
  return match?.key ?? "dashboard";
}
