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
    <SidebarProvider defaultOpen={defaultOpen} style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
      <AppSidebar storeName={settings?.storeName ?? ""} toConfirm={toConfirm} />
      {/*
        Open plane: the sidebar sits on the page ground behind one hairline, there is no
        top bar on desktop, and the title and cards sit straight on the ground.
        One gutter (40px) and one column (max 1240px) for every screen.
        On a phone the sidebar folds into a 48px bar with the screen's name.
      */}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="px-4 pt-5 pb-16 md:px-10 md:pt-9">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
