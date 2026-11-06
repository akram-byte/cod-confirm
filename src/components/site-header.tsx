"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-mark";
import { useI18n } from "@/i18n/client";
import { navKeyFor } from "@/components/nav";

/** Phone and tablet only: the sidebar folds into this 48px bar. On desktop the title lives in the canvas. */
export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3 md:hidden">
      <SidebarTrigger className="size-9" aria-label={t.nav.toggleSidebar} />
      <span className="truncate text-base font-semibold">{t.pages[navKeyFor(pathname)].title}</span>
      <BrandMark className="ms-auto size-7" />
    </header>
  );
}
