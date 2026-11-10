"use client";

import { Suspense, useEffect, useRef, useTransition } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Languages, LogOut, Moon, Search, Sun } from "lucide-react";
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
  // The ladder: an active row is the palest tint with the hue's dark ink; only its icon takes the full hue.
  const item =
    "h-8 text-muted-foreground transition-colors duration-150 hover:text-foreground data-active:font-medium data-active:text-sidebar-accent-foreground data-active:[&>svg]:text-primary";
  // The active pill is one element that glides between rows (32px rows on a 34px pitch).
  const activeIndex = NAV.findIndex((n) => n.key === active);

  return (
    <Sidebar
      side={dir === "rtl" ? "right" : "left"}
      dir={dir}
      collapsible="icon"
      mobileTitle={t.nav.menu}
      mobileDescription={t.nav.menuDescription}
    >
      <SidebarHeader className="gap-3 pt-5">
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
        <Suspense fallback={<div className="h-8 group-data-[collapsible=icon]:hidden" />}>
          <OrderSearch />
        </Suspense>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-2">
          <SidebarGroupContent className="relative">
            <span
              aria-hidden
              className="glide absolute inset-x-0 top-0 h-8 rounded-md bg-sidebar-accent"
              style={{ transform: `translateY(${activeIndex * 34}px)`, opacity: activeIndex < 0 ? 0 : 1 }}
            />
            <SidebarMenu className="relative gap-0.5">
              {NAV.map((n) => (
                <SidebarMenuItem key={n.key}>
                  <SidebarMenuButton
                    render={<Link href={n.href} />}
                    isActive={active === n.key}
                    tooltip={t.nav[n.key]}
                    className={`${item} data-active:bg-transparent data-active:hover:bg-transparent hover:bg-accent`}
                    onClick={close}
                  >
                    <n.icon strokeWidth={1.6} />
                    <span>{t.nav[n.key]}</span>
                  </SidebarMenuButton>
                  {n.key === "confirmation" && toConfirm > 0 && (
                    <SidebarMenuBadge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums peer-hover/menu-button:text-primary-foreground peer-data-active/menu-button:text-primary-foreground">
                      {toConfirm}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-3 pb-4">
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

/** One order search for the whole app, at the top of the sidebar. "/" or Ctrl+K focuses it. */
function OrderSearch() {
  const { t } = useI18n();
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";
  const { isMobile, setOpenMobile } = useSidebar();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Form
      action="/orders"
      role="search"
      className="group-data-[collapsible=icon]:hidden"
      key={pathname === "/orders" ? q : "search"}
      onSubmit={() => {
        if (isMobile) setOpenMobile(false);
      }}
    >
      <label className="relative block">
        <span className="sr-only">{t.header.searchLabel}</span>
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={input}
          name="q"
          type="search"
          defaultValue={pathname === "/orders" ? q : ""}
          placeholder={t.header.search}
          autoComplete="off"
          className="h-9 w-full rounded-md border border-sidebar-border bg-card ps-8 pe-8 text-sm text-ellipsis transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground hover:border-input focus:border-ring focus:ring-3 focus:ring-ring/25 md:h-8 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="pointer-events-none absolute end-2 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-sans text-[11px] leading-4 text-muted-foreground md:block">
          /
        </kbd>
      </label>
    </Form>
  );
}
