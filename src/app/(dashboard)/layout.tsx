import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  await requireOwner();
  const [cookieStore, settings] = await Promise.all([
    cookies(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true } }),
  ]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar storeName={settings?.storeName ?? ""} />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
