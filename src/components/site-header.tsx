"use client";

import { useEffect, useRef } from "react";
import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-mark";
import { useI18n } from "@/i18n/client";
import { navKeyFor } from "@/components/nav";

/**
 * The top of the frame, on the frame's own tint with no rule under it.
 * Desktop: the sidebar toggle and one centred order search ("/" focuses it).
 * Phone: the sheet becomes the screen; this bar holds the menu, the screen's name and the mark.
 */
export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";
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
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 bg-frame px-3 md:static md:px-2">
      <SidebarTrigger className="size-9 md:size-8" aria-label={t.nav.toggleSidebar} />

      <span className="truncate text-base font-semibold md:hidden">{t.pages[navKeyFor(pathname)].title}</span>

      <Form
        action="/orders"
        role="search"
        className="mx-auto hidden w-full max-w-[520px] md:block"
        key={pathname === "/orders" ? q : "search"}
      >
        <label className="relative block">
          <span className="sr-only">{t.header.searchLabel}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={input}
            name="q"
            type="search"
            defaultValue={pathname === "/orders" ? q : ""}
            placeholder={t.header.search}
            autoComplete="off"
            className="h-8 w-full rounded-lg bg-background/70 ps-9 pe-10 text-sm ring-1 ring-border transition-[background-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground hover:bg-background focus:bg-background focus:ring-2 focus:ring-ring/60 [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rounded border bg-background px-1.5 font-sans text-[11px] leading-4 text-muted-foreground">
            /
          </kbd>
        </label>
      </Form>

      {/* Balances the toggle so the search sits on the window's centre line. */}
      <span className="hidden size-8 md:block" aria-hidden />
      <BrandMark className="ms-auto size-7 md:hidden" />
    </header>
  );
}
