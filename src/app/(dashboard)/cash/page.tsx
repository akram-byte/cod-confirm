import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { KpiStrip } from "@/components/stats/kpi-strip";
import { closedAt, collectedOf, expectedOf, getPayouts, getUnpaid, isLate, LATE_DAYS } from "@/lib/cash";
import { formatAgo, formatDate } from "@/lib/format";
import { formatDZD } from "@/lib/money";
import { todayKey } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { DeletePayoutButton, UnpaidList, type UnpaidRow } from "./cash-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.cash.title };
}

export default async function CashPage() {
  const [t, locale, { orders, total }, payouts] = await Promise.all([getDictionary(), getLocale(), getUnpaid(), getPayouts()]);

  const rows: UnpaidRow[] = orders.map((o) => {
    const at = closedAt(o);
    return {
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      returned: o.status === "RETURNED",
      tracking: o.trackingNumber ?? "",
      collected: collectedOf(o),
      expected: expectedOf(o),
      ago: at ? formatAgo(at, locale) : "",
      late: isLate(at),
    };
  });
  const sum = (list: UnpaidRow[], k: "collected" | "expected") => list.reduce((s, r) => s + r[k], 0);
  const late = rows.filter((r) => r.late);
  const missing = payouts.reduce((s, p) => s + Math.min(0, p.amount - p.expected), 0);

  return (
    <>
      <PageIntro title={t.pages.cash.title} description={t.pages.cash.description} />

      <KpiStrip
        className="mb-6"
        items={[
          { label: t.cash.withCourier, value: formatDZD(sum(rows, "collected"), locale), hint: fill(t.cash.parcels, { count: total }) },
          { label: t.cash.toReceive, value: formatDZD(sum(rows, "expected"), locale), hint: t.cash.estimate, lead: true },
          {
            label: fill(t.cash.late, { days: LATE_DAYS }),
            value: formatDZD(sum(late, "expected"), locale),
            hint: fill(t.cash.parcels, { count: late.length }),
            tone: late.length > 0 ? "bad" : undefined,
          },
          { label: t.cash.missing, value: formatDZD(Math.abs(missing), locale), hint: t.cash.missingHint, tone: missing < 0 ? "bad" : undefined },
        ]}
      />

      <h2 className="mb-2 text-base font-semibold">{t.cash.unpaidTitle}</h2>
      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title={t.cash.emptyTitle} description={t.cash.emptyText} />
      ) : (
        <UnpaidList rows={rows} today={todayKey()} />
      )}

      <h2 className="mt-8 mb-2 text-base font-semibold">{t.cash.payoutsTitle}</h2>
      {payouts.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{t.cash.noPayouts}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card text-sm">
          {payouts.map((p) => {
            const diff = p.amount - p.expected;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium tabular-nums">
                    {formatDate(p.receivedAt, locale)} · {fill(t.cash.parcels, { count: p._count.orders })}
                  </p>
                  {p.note && <p className="truncate text-xs text-muted-foreground">{p.note}</p>}
                </div>
                <div className="text-end">
                  <p className="font-semibold tabular-nums">{formatDZD(p.amount, locale)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t.cash.expected}: {formatDZD(p.expected, locale)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium tabular-nums",
                    diff < 0
                      ? "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]"
                      : "bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]",
                  )}
                >
                  {diff < 0 ? fill(t.cash.short, { value: formatDZD(-diff, locale) }) : t.cash.ok}
                </span>
                <DeletePayoutButton id={p.id} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
