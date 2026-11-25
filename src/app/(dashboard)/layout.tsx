import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AccessBanner } from "@/components/access-banner";
import { SectionTabs } from "@/components/section-tabs";
import { BottomBar } from "@/components/bottom-bar";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { countAbandoned, countToConfirm, countToRescue } from "@/lib/today-counts";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  // The owner check runs alongside the reads (one database round trip instead of two);
  // nothing is shown until it passes.
  const [role, cookieStore, settings, toConfirm, toRescue, abandoned] = await Promise.all([
    requireStaff(),
    cookies(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true } }),
    countToConfirm(),
    countToRescue(),
    countAbandoned(),
  ]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  // Owner-only pages are kept from the caller login by src/proxy.ts and requireOwner() in their actions.
  const caller = role === "caller";

  return (
    <SidebarProvider defaultOpen={defaultOpen} style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
      <AppSidebar storeName={settings?.storeName ?? ""} toConfirm={toConfirm} toRescue={toRescue} caller={caller} />
      {/*
        Open plane: the sidebar sits on the page ground behind one hairline, there is no
        top bar on desktop, and the title and cards sit straight on the ground.
        One gutter (40px) and one column (max 1240px) for every screen.
        On a phone the sidebar folds into a 48px bar with the screen's name.
      */}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="px-4 pt-5 pb-28 md:px-10 md:pt-9 md:pb-16">
          <div className="mx-auto w-full max-w-[1240px]">
            <AccessBanner />
            <SectionTabs counts={{ confirmation: toConfirm, abandoned, rescue: toRescue }} caller={caller} />
            {children}
          </div>
        </div>
        <BottomBar toConfirm={toConfirm} toRescue={toRescue} caller={caller} />
      </SidebarInset>
    </SidebarProvider>
  );
}
