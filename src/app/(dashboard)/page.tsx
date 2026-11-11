import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PhoneCall } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { KpiStrip } from "@/components/stats/kpi-strip";
import { OrdersChart } from "@/components/stats/lazy-charts";
import { OrderJourney } from "@/components/stats/order-outcomes";
import { StatusBadge } from "@/components/status-badge";
import { getQueue } from "@/lib/confirmation";
import { addDays, getStats, todayKey } from "@/lib/stats";
import { formatDZD } from "@/lib/money";
import { formatAgo, formatPercent, startOfDay } from "@/lib/format";
import { getWilaya, wilayaLabel } from "@/lib/algeria";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.dashboard.title };
}

const NEXT_CALLS = 5;

// Screen question: "What needs doing now, and where are my orders ending up?"
export default async function DashboardHome() {
  const today = todayKey();
  const [t, locale, todayOrders, { queue }, month] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.count({ where: { createdAt: { gte: startOfDay(today)! } } }),
    getQueue(),
    getStats({ from: addDays(today, -29), to: today }),
  ]);
  // The 14-day chart is the tail of the 30-day numbers (no second query).
  const last14Days = month.days.slice(-14);
  const toConfirm = queue.length;
  const next = queue.slice(0, NEXT_CALLS);

  const finding =
    toConfirm > 0
      ? `${fill(t.home.findingWaiting, { count: toConfirm })} · ${fill(t.home.findingToday, { count: todayOrders })}`
      : t.home.findingClear;

  return (
    <>
      <PageIntro title={t.pages.dashboard.title} description={finding}>
        {toConfirm > 0 && (
          <Link href="/confirmation" className={buttonVariants({ size: "lg", className: "h-9 px-4" })}>
            <PhoneCall className="size-4" />
            {t.home.startCalling}
            <span className="tabular-nums opacity-70">{toConfirm}</span>
          </Link>
        )}
      </PageIntro>

      <KpiStrip
        items={[
          { label: t.cards.todayOrders, value: String(todayOrders) },
          { label: t.cards.toConfirm, value: String(toConfirm) },
          {
            label: t.cards.confirmationRate,
            value: formatPercent(month.confirmationRate, locale),
            hint: t.stats.last30,
          },
          {
            label: t.cards.returnRate,
            value: formatPercent(month.returnRate, locale),
            hint: t.stats.last30,
            tone: month.returnRate !== null && month.returnRate > 0.25 ? "bad" : undefined,
          },
          {
            label: t.cards.profit,
            value: formatDZD(month.profit, locale),
            hint: t.stats.last30,
            tone: month.profit < 0 ? "bad" : undefined,
            lead: true,
          },
        ]}
      />

      <div className="@container mt-3">
        <div className="grid items-stretch gap-3 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <OrderJourney
            t={t}
            locale={locale}
            data={{
              orders: month.orders,
              pending: month.pending,
              cancelled: month.cancelled,
              confirmed: month.confirmed,
              shipped: month.shipped,
              delivered: month.delivered,
              returned: month.returned,
              sales: month.sales,
              returnCosts: month.returnCosts,
            }}
          />

          <section className="rounded-xl bg-card ring-1 ring-border">
            <div className="flex items-baseline justify-between gap-2 px-5 pt-5 pb-2">
              <h2 className="text-base font-semibold">{t.home.nextCalls}</h2>
              {toConfirm > 0 && (
                <Link href="/confirmation" className="text-sm text-muted-foreground hover:text-foreground">
                  {t.home.viewAll}
                </Link>
              )}
            </div>
            {next.length === 0 ? (
              <p className="mx-5 mb-5 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                {t.home.findingClear}
              </p>
            ) : (
              <ul className="pb-2">
                {next.map((o) => {
                  const w = getWilaya(o.wilayaCode);
                  return (
                    <li key={o.id}>
                      <Link
                        href={`/confirmation?id=${o.id}`}
                        className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            <bdi>{o.customerName}</bdi>{" "}
                            <span className="font-normal text-muted-foreground">#{o.number}</span>
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {w ? wilayaLabel(w, locale) : o.wilayaCode} ·{" "}
                            {fill(t.home.waiting, {
                              time: formatAgo(
                                o.status === "CALLBACK" && o.callbackAt ? o.callbackAt : o.createdAt,
                                locale,
                              ),
                            })}
                          </p>
                        </div>
                        {o.status !== "NEW" && <StatusBadge status={o.status} label={t.status[o.status]} />}
                        <span className="w-24 shrink-0 text-end text-sm tabular-nums">
                          {formatDZD(o.total, locale)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="mt-3 rounded-xl bg-card p-5 ring-1 ring-border">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{t.stats.ordersChart}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{t.stats.last14}</span>
            <Link
              href="/stats"
              className={cn("inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground")}
            >
              {t.stats.seeStats}
              <ArrowLeft className="size-4 ltr:rotate-180" />
            </Link>
          </div>
        </div>
        <OrdersChart
          className="aspect-auto h-56 w-full"
          data={last14Days.map(({ day, orders, confirmed, delivered, profit }) => ({
            day,
            orders,
            confirmed,
            delivered,
            profit,
          }))}
        />
      </section>
    </>
  );
}
