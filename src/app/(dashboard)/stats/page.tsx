import type { Metadata } from "next";
import { KpiStrip } from "@/components/stats/kpi-strip";
import { PageIntro } from "@/components/page-intro";
import { OrdersChart, ProfitChart } from "@/components/stats/lazy-charts";
import { RangePicker } from "@/components/stats/range-picker";
import { getStats, parseRange, todayKey } from "@/lib/stats";
import { formatDZD } from "@/lib/money";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { wilayaLabel, getWilaya } from "@/lib/algeria";
import { BAD_RETURN_RATE, MIN_PARCELS, deskReturnRate, getWilayaReport, homeReturnRate, returnRate, suggestDeskOnly } from "@/lib/wilaya-report";
import { AdSpendCard } from "./ad-spend";
import { ProductCosts } from "./product-costs";
import { getProductReport } from "@/lib/product-report";
import { db } from "@/lib/db";
import { WilayaReturns, type WilayaReturnRow } from "./wilaya-returns";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.stats.title };
}

export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  const range = parseRange(await searchParams);
  const [t, locale, s, report, productReport, products] = await Promise.all([
    getDictionary(),
    getLocale(),
    getStats(range),
    getWilayaReport(range),
    getProductReport(range),
    db.product.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  const wilayaRows: WilayaReturnRow[] = report.map((r) => {
    const w = getWilaya(r.wilayaCode);
    const rr = returnRate(r);
    return {
      wilayaCode: r.wilayaCode,
      label: w ? wilayaLabel(w, locale) : String(r.wilayaCode),
      delivered: r.delivered,
      returned: r.returned,
      returnRate: rr,
      homeRate: homeReturnRate(r),
      deskRate: deskReturnRate(r),
      loss: r.loss,
      net: r.net,
      deskOnly: r.deskOnly,
      hasFee: r.hasFee,
      suggest: suggestDeskOnly(r),
      bad: rr !== null && rr >= BAD_RETURN_RATE && r.delivered + r.returned >= MIN_PARCELS,
    };
  });
  const money = (n: number) => formatDZD(n, locale);
  const pct = (n: number | null) => formatPercent(n, locale);
  const chartDays = s.days.map(({ day, orders, confirmed, delivered, profit }) => ({
    day,
    orders,
    confirmed,
    delivered,
    profit,
  }));

  const breakdown = [
    { label: t.stats.sales, value: s.sales, sign: 1 },
    { label: t.stats.productCost, value: s.productCost, sign: -1 },
    { label: t.stats.deliveryFees, value: s.deliveryFees, sign: -1 },
    { label: t.stats.returnCosts, value: s.returnCosts, sign: -1 },
    { label: t.stats.adSpend, value: s.adSpend, sign: -1 },
  ];

  return (
    <>
      <PageIntro title={t.pages.stats.title} description={t.stats.basis} />
      <div className="mb-4">
        <RangePicker key={`${range.from}-${range.to}`} from={range.from} to={range.to} preset={range.preset} />
      </div>

      <KpiStrip
        items={[
          { label: t.stats.orders, value: String(s.orders), hint: fill(t.stats.pending, { count: s.pending }) },
          { label: t.stats.confirmationRate, value: pct(s.confirmationRate), hint: t.stats.confirmationHint },
          {
            label: t.stats.deliveryRate,
            value: pct(s.deliveryRate),
            hint: fill(t.stats.onTheRoad, { count: s.shipped }),
          },
          {
            label: t.stats.returnRate,
            value: pct(s.returnRate),
            hint: t.stats.returnHint,
            tone: s.returnRate !== null && s.returnRate > 0.25 ? "bad" : undefined,
          },
          { label: t.stats.profit, value: money(s.profit), tone: s.profit < 0 ? "bad" : undefined, lead: true },
        ]}
      />

      {/* Two columns that each stack their cards, so both columns end level:
          left = the charts (2/3), right = the money (1/3). */}
      <div className="@container mt-3">
        <div className="grid items-start gap-3 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-3">
            <section className="rounded-xl bg-card p-5 ring-1 ring-border">
              <h2 className="mb-3 text-base font-semibold">{t.stats.ordersChart}</h2>
              {s.orders === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                  {t.stats.noData}
                </p>
              ) : (
                <OrdersChart data={chartDays} />
              )}
            </section>
            <section className="rounded-xl bg-card p-5 ring-1 ring-border">
              <h2 className="mb-3 text-base font-semibold">{t.stats.profitChart}</h2>
              {s.orders === 0 && s.adSpend === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                  {t.stats.noData}
                </p>
              ) : (
                <ProfitChart data={chartDays} />
              )}
            </section>
          </div>

          <div className="grid gap-3">
            <section className="rounded-xl bg-card p-5 ring-1 ring-border">
              <h2 className="mb-3 text-base font-semibold">{t.stats.profitTitle}</h2>
              <dl className="text-sm">
                {breakdown.map((b) => (
                  <div key={b.label} className="flex justify-between gap-2 border-b border-rule py-2">
                    <dt className="text-muted-foreground">{b.label}</dt>
                    <dd className="tabular-nums">
                      {b.sign < 0 && b.value > 0 ? "− " : ""}
                      {money(b.value)}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-2 pt-3 text-base font-bold">
                  <dt>{t.stats.profit}</dt>
                  <dd className={cn("tabular-nums", s.profit < 0 && "text-negative")}>{money(s.profit)}</dd>
                </div>
              </dl>
            </section>
            <AdSpendCard
              key={`${range.from}-${range.to}`}
              today={todayKey()}
              entries={s.adEntries}
              products={products}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ProductCosts rows={productReport.rows} generalAds={productReport.generalAds} t={t} locale={locale} />
      </div>

      <div className="mt-3">
        <WilayaReturns rows={wilayaRows} />
      </div>
    </>
  );
}
