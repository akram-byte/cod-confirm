import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { db } from "@/lib/db";
import { DELIVERY_TABS, type DeliveryTab } from "@/lib/delivery";
import { risksFor } from "@/lib/customers";
import { formatDateTime } from "@/lib/format";
import { getWilaya, wilayaLabel } from "@/lib/algeria";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { DeliveryTable } from "./delivery-table";

const LIMIT = 500;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.delivery.title };
}

const DATE_FIELD = {
  CONFIRMED: "confirmedAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
  RETURNED: "returnedAt",
} as const;

export default async function DeliveryPage({ searchParams }: PageProps<"/delivery">) {
  const sp = await searchParams;
  const tab: DeliveryTab = (DELIVERY_TABS as readonly string[]).includes(String(sp.tab)) ? (sp.tab as DeliveryTab) : "CONFIRMED";
  const field = DATE_FIELD[tab];

  const [t, locale, counts, orders] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.groupBy({ by: ["status"], where: { status: { in: [...DELIVERY_TABS] } }, _count: { _all: true } }),
    db.order.findMany({
      where: { status: tab },
      // To ship: oldest first. Others: most recent first.
      orderBy: { [field]: tab === "CONFIRMED" ? "asc" : "desc" },
      take: LIMIT,
      include: { items: { select: { productName: true, quantity: true } } },
    }),
  ]);
  const countOf = (s: DeliveryTab) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const risks = await risksFor(orders.map((o) => o.customerId));

  const rows = orders.map((o) => {
    const w = getWilaya(o.wilayaCode);
    const at = o[field];
    return {
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      phone: o.phone,
      wilaya: w ? wilayaLabel(w, locale) : String(o.wilayaCode),
      deliveryType: o.deliveryType,
      products: o.items.map((i) => (i.quantity > 1 ? `${i.productName} ×${i.quantity}` : i.productName)).join("، "),
      total: o.total,
      returnCost: o.returnCost,
      tracking: o.trackingNumber ?? "",
      date: at ? formatDateTime(at, locale) : "",
      risk: risks.get(o.customerId),
    };
  });

  return (
    <>
      <PageIntro title={t.pages.delivery.title} description={t.pages.delivery.description} />

      <nav className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1" aria-label={t.pages.delivery.title}>
        {DELIVERY_TABS.map((s) => (
          <Link
            key={s}
            href={`/delivery?tab=${s}`}
            replace
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap",
              s === tab ? "bg-card text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.delivery.tabs[s]}
            <span className="rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums">{countOf(s)}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState icon={Truck} title={t.delivery.emptyTitle} description={t.delivery.emptyText} />
      ) : (
        <DeliveryTable key={tab} tab={tab} rows={rows} total={countOf(tab)} />
      )}
    </>
  );
}
