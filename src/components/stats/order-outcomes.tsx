import type { Dictionary } from "@/i18n/ar";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The COD funnel: where every order of the period ended up, as one 100% bar
 * with 2px seams and a legend that is a table. Only delivered (the money) takes the data hue.
 */
export type Outcomes = {
  orders: number;
  delivered: number;
  onTheWay: number;
  waiting: number;
  cancelled: number;
  returned: number;
  deliveredMoney: number;
};

const PARTS = [
  { key: "delivered", swatch: "bg-data" },
  { key: "onTheWay", swatch: "bg-chart-1" },
  { key: "waiting", swatch: "bg-chart-4" },
  { key: "cancelled", swatch: "bg-chart-2" },
  { key: "returned", swatch: "bg-negative" },
] as const;

export function OrderOutcomes({ data, t, locale }: { data: Outcomes; t: Dictionary; locale: Locale }) {
  const total = data.orders;
  // Every part comes from the same rows, so the parts always add up to the total.
  console.assert(
    data.delivered + data.onTheWay + data.waiting + data.cancelled + data.returned === total,
    "outcome parts must add up to the order count",
  );

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{t.home.outcomesTitle}</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{fill(t.home.outcomesTotal, { count: total })}</span>
      </div>

      {total === 0 ? (
        <p className="mt-4 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">{t.home.outcomesEmpty}</p>
      ) : (
        <>
          {/* Time runs nowhere here, but the bar reads in the page's direction. */}
          <div className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-[3px]">
            {PARTS.map((p) =>
              data[p.key] > 0 ? (
                <div key={p.key} className={p.swatch} style={{ flexGrow: data[p.key], flexBasis: 0 }} title={t.home.parts[p.key]} />
              ) : null,
            )}
          </div>

          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-2 text-start font-normal" />
                <th className="w-20 pb-2 text-end font-normal">{t.home.count}</th>
                <th className="w-20 pb-2 text-end font-normal">{t.home.share}</th>
              </tr>
            </thead>
            <tbody>
              {PARTS.map((p) => (
                <tr key={p.key} className="border-t border-rule">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className={cn("size-2.5 shrink-0 rounded-[2px]", p.swatch)} />
                      <span className={cn(p.key === "delivered" && "font-medium")}>{t.home.parts[p.key]}</span>
                      {p.key === "delivered" && data.deliveredMoney > 0 && (
                        <span className="hidden text-muted-foreground tabular-nums sm:inline">· {formatDZD(data.deliveredMoney, locale)}</span>
                      )}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-end tabular-nums",
                      data[p.key] === 0 && "text-muted-foreground",
                      p.key === "returned" && data.returned > 0 && "text-negative",
                    )}
                  >
                    {data[p.key]}
                  </td>
                  <td className="py-2.5 text-end text-muted-foreground tabular-nums">
                    {formatPercent(data[p.key] / total, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
