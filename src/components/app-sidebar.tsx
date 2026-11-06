"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Languages, LogOut, Moon, Sun } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-mark";
import { useI18n } from "@/i18n/client";
import { dirOf } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { logout } from "@/app/login/actions";
import { NAV, navKeyFor } from "@/components/nav";

export function AppSidebar({ storeName, toConfirm }: { storeName: string; toConfirm: number }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const active = navKeyFor(pathname);
  const { isMobile, setOpenMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const dir = dirOf(locale);
  const close = () => {
    if (isMobile) setOpenMobile(false);
  };
  const other = locale === "ar" ? "fr" : "ar";
  const dark = resolvedTheme === "dark";
  const item = "h-8 text-muted-foreground data-active:text-foreground";

  return (
    <Sidebar
      side={dir === "rtl" ? "right" : "left"}
      dir={dir}
      collapsible="icon"
      mobileTitle={t.nav.menu}
      mobileDescription={t.nav.menuDescription}
    >
      <SidebarHeader className="pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} onClick={close} className="hover:bg-transparent">
              <BrandMark />
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate font-semibold">{storeName || t.app.name}</span>
                <span className="truncate text-xs text-muted-foreground">{t.app.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV.map((n) => (
                <SidebarMenuItem key={n.key}>
                  <SidebarMenuButton
                    render={<Link href={n.href} />}
                    isActive={active === n.key}
                    tooltip={t.nav[n.key]}
                    className={item}
                    onClick={close}
                  >
                    <n.icon strokeWidth={1.6} />
                    <span>{t.nav[n.key]}</span>
                  </SidebarMenuButton>
                  {n.key === "confirmation" && toConfirm > 0 && (
                    <SidebarMenuBadge className="text-foreground tabular-nums">{toConfirm}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              className={item}
              tooltip={t.header.language}
              disabled={pending}
              onClick={() => startTransition(() => setLocale(other))}
            >
              <Languages strokeWidth={1.6} />
              <span lang={other}>{other === "fr" ? "Français" : "العربية"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {/* Icon and label switch with CSS: the theme is unknown on the server. */}
            <SidebarMenuButton className={item} tooltip={t.header.theme} onClick={() => setTheme(dark ? "light" : "dark")}>
              <Moon strokeWidth={1.6} className="dark:hidden" />
              <Sun strokeWidth={1.6} className="hidden dark:block" />
              <span>
                <span className="dark:hidden">{t.header.dark}</span>
                <span className="hidden dark:inline">{t.header.light}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className={item} tooltip={t.header.logout} onClick={() => startTransition(() => logout())}>
              <LogOut strokeWidth={1.6} className="rtl:rotate-180" />
              <span>{t.header.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
