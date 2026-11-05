"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/i18n/client";
import { dirOf } from "@/i18n/config";
import { NAV, navKeyFor } from "@/components/nav";

export function AppSidebar({ storeName }: { storeName: string }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const active = navKeyFor(pathname);
  const { isMobile, setOpenMobile } = useSidebar();
  const dir = dirOf(locale);

  return (
    <Sidebar
      side={dir === "rtl" ? "right" : "left"}
      dir={dir}
      collapsible="icon"
      mobileTitle={t.nav.menu}
      mobileDescription={t.nav.menuDescription}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} onClick={() => isMobile && setOpenMobile(false)}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PackageCheck className="size-4" />
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate font-semibold">{storeName || t.app.name}</span>
                <span className="truncate text-xs text-muted-foreground">{t.app.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.main}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={active === item.key}
                    tooltip={t.nav[item.key]}
                    size="lg"
                    className="h-10"
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <item.icon />
                    <span>{t.nav[item.key]}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
