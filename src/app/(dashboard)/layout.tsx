import { Suspense } from "react";
import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  await requireOwner();
  const now = new Date();
  const [cookieStore, settings, toConfirm] = await Promise.all([
    cookies(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true } }),
    // Same rule as the confirmation queue: the one count in the nav that needs action.
    db.order.count({
      where: { OR: [{ status: { in: ["NEW", "NO_ANSWER"] } }, { status: "CALLBACK", callbackAt: { lte: now } }] },
    }),
  ]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen} style={{ "--sidebar-width": "14.5rem" } as React.CSSProperties}>
      <AppSidebar storeName={settings?.storeName ?? ""} toConfirm={toConfirm} />
      {/*
        The frame: sidebar + 48px top bar share one tint with no rule between them.
        The sheet: white, 16px corners, a 1px edge, no shadow, inset 8px from the
        window's far side and bottom. On desktop it scrolls on its own so the frame stays put;
        on a phone the frame disappears and the sheet is the screen.
      */}
      <SidebarInset className="min-w-0 bg-frame md:h-svh md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
        <Suspense fallback={<div className="h-12 shrink-0" />}>
          <SiteHeader />
        </Suspense>
        <div
          id="sheet"
          className="flex-1 bg-background md:me-2 md:mb-2 md:overflow-y-auto md:overscroll-contain md:rounded-2xl md:border md:[scrollbar-gutter:stable]"
        >
          <div className="px-4 pt-5 pb-12 md:px-8 md:pt-7">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
