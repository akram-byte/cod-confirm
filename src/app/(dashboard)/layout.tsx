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
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar storeName={settings?.storeName ?? ""} toConfirm={toConfirm} />
      {/* SidebarInset is the page's <main>; the canvas is one fluid column, 32px gutters on desktop. */}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="flex-1 px-4 pt-5 pb-12 md:px-8 md:pt-8">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
