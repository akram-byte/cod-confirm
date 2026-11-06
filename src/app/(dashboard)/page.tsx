import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleDollarSign, PhoneCall, ShoppingBag, TrendingUp, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageIntro } from "@/components/page-intro";
import { KpiCard } from "@/components/stats/kpi-card";
import { OrdersChart } from "@/components/stats/charts";
import { db } from "@/lib/db";
import { addDays, getStats, todayKey } from "@/lib/stats";
import { formatDZD } from "@/lib/money";
import { formatPercent, startOfDay } from "@/lib/format";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.dashboard.title };
}

export default async function DashboardHome() {
  const today = todayKey();
  const now = new Date();
  const [t, locale, todayOrders, toConfirm, month, last14] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.count({ where: { createdAt: { gte: startOfDay(today)! } } }),
    // Same rule as the confirmation queue.
    db.order.count({
      where: { OR: [{ status: { in: ["NEW", "NO_ANSWER"] } }, { status: "CALLBACK", callbackAt: { lte: now } }] },
    }),
    getStats({ from: addDays(today, -29), to: today }),
    getStats({ from: addDays(today, -13), to: today }),
  ]);

  return (
    <>
      <PageIntro description={t.pages.dashboard.description} />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        <KpiCard label={t.cards.todayOrders} value={String(todayOrders)} icon={ShoppingBag} />
        <Link href="/confirmation" className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <KpiCard
            label={t.cards.toConfirm}
            value={String(toConfirm)}
            icon={PhoneCall}
            className="h-full transition-colors hover:bg-muted/40"
          />
        </Link>
        <KpiCard
          label={t.cards.confirmationRate}
          value={formatPercent(month.confirmationRate, locale)}
          hint={t.stats.last30}
          icon={TrendingUp}
        />
        <KpiCard
          label={t.cards.returnRate}
          value={formatPercent(month.returnRate, locale)}
          hint={t.stats.last30}
          icon={Undo2}
          tone={month.returnRate !== null && month.returnRate > 0.25 ? "bad" : undefined}
        />
        <KpiCard
          label={t.cards.profit}
          value={formatDZD(month.profit, locale)}
          hint={t.stats.last30}
          icon={CircleDollarSign}
          tone={month.profit < 0 ? "bad" : month.profit > 0 ? "good" : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm text-muted-foreground">
            {t.stats.ordersChart} · {t.stats.last14}
          </CardTitle>
          <Link href="/stats" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {t.stats.seeStats}
            <ArrowLeft className="size-4 ltr:rotate-180" />
          </Link>
        </CardHeader>
        <CardContent>
          <OrdersChart
            data={last14.days.map(({ day, orders, confirmed, delivered, profit }) => ({ day, orders, confirmed, delivered, profit }))}
          />
        </CardContent>
      </Card>
    </>
  );
}
