import type { Metadata } from "next";
import { CircleCheck, CircleDollarSign, PhoneCall, ShoppingBag, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/stats/kpi-card";
import { OrdersChart, ProfitChart } from "@/components/stats/charts";
import { RangePicker } from "@/components/stats/range-picker";
import { getStats, parseRange, todayKey } from "@/lib/stats";
import { formatDZD } from "@/lib/money";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { AdSpendCard } from "./ad-spend";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.stats.title };
}

export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  const range = parseRange(await searchParams);
  const [t, locale, s] = await Promise.all([getDictionary(), getLocale(), getStats(range)]);
  const money = (n: number) => formatDZD(n, locale);
  const pct = (n: number | null) => formatPercent(n, locale);
  const chartDays = s.days.map(({ day, orders, confirmed, delivered, profit }) => ({ day, orders, confirmed, delivered, profit }));

  const breakdown = [
    { label: t.stats.sales, value: s.sales, sign: 1 },
    { label: t.stats.productCost, value: s.productCost, sign: -1 },
    { label: t.stats.deliveryFees, value: s.deliveryFees, sign: -1 },
    { label: t.stats.returnCosts, value: s.returnCosts, sign: -1 },
    { label: t.stats.adSpend, value: s.adSpend, sign: -1 },
  ];

  return (
    <>
      <div className="mb-6 space-y-2">
        <RangePicker key={`${range.from}-${range.to}`} from={range.from} to={range.to} preset={range.preset} />
        <p className="text-xs text-muted-foreground">{t.stats.basis}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        <KpiCard label={t.stats.orders} value={String(s.orders)} hint={fill(t.stats.pending, { count: s.pending })} icon={ShoppingBag} />
        <KpiCard label={t.stats.confirmationRate} value={pct(s.confirmationRate)} hint={t.stats.confirmationHint} icon={PhoneCall} />
        <KpiCard
          label={t.stats.deliveryRate}
          value={pct(s.deliveryRate)}
          hint={fill(t.stats.onTheRoad, { count: s.shipped })}
          icon={CircleCheck}
        />
        <KpiCard
          label={t.stats.returnRate}
          value={pct(s.returnRate)}
          hint={t.stats.returnHint}
          icon={Undo2}
          tone={s.returnRate !== null && s.returnRate > 0.25 ? "bad" : undefined}
        />
        <KpiCard
          label={t.stats.profit}
          value={money(s.profit)}
          icon={CircleDollarSign}
          tone={s.profit < 0 ? "bad" : s.profit > 0 ? "good" : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t.stats.ordersChart}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.orders === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">{t.stats.noData}</p> : <OrdersChart data={chartDays} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t.stats.profitTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {breakdown.map((b) => (
                <div key={b.label} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{b.label}</dt>
                  <dd className={cn("tabular-nums", b.sign < 0 && b.value > 0 && "text-red-600 dark:text-red-400")}>
                    {b.sign < 0 && b.value > 0 ? "− " : ""}
                    {money(b.value)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-2 border-t pt-2 text-base font-semibold">
                <dt>{t.stats.profit}</dt>
                <dd className={cn("tabular-nums", s.profit < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")}>
                  {money(s.profit)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t.stats.profitChart}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.orders === 0 && s.adSpend === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t.stats.noData}</p>
            ) : (
              <ProfitChart data={chartDays} />
            )}
          </CardContent>
        </Card>

        <AdSpendCard
          key={`${range.from}-${range.to}`}
          today={todayKey()}
          entries={s.days
            .filter((d) => d.adSpend > 0)
            .map((d) => ({ day: d.day, amount: d.adSpend }))
            .reverse()}
        />
      </div>
    </>
  );
}
