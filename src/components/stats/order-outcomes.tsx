import type { Dictionary } from "@/i18n/ar";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The COD journey, the element only this product has: every order of the period walks
 * Received → Confirmed → Shipped → Delivered, and under each step sits what left the road there
 * (still waiting, cancelled, not shipped yet, returned). Each bar is the step's share of what was
 * received, so the drop between two steps is the money lost between them.
 * The steps are the accent ladder itself: each rung is one tint stronger, and only Delivered
 * (the cash) takes the full hue. Only returns (a paid loss) take the negative colour.
 */
export type Journey = {
  orders: number;
  pending: number;
  cancelled: number;
  confirmed: number; // reached CONFIRMED or later
  shipped: number; // on the road now
  delivered: number;
  returned: number;
  sales: number;
  returnCosts: number;
};

// Palest tint to full hue, one step per stage.
const RUNGS = ["bg-hue-track", "bg-[color-mix(in_oklch,var(--hue-mid)_55%,var(--hue-track))]", "bg-hue-mid", "bg-data"];

export function OrderJourney({ data, t, locale }: { data: Journey; t: Dictionary; locale: Locale }) {
  const j = t.home.journey;
  const left = data.shipped + data.delivered + data.returned; // left the shop
  const toShip = data.confirmed - left;
  // Every step comes from the same rows, so the parts always add up.
  console.assert(data.pending + data.cancelled + data.confirmed === data.orders, "journey: received must split into waiting, cancelled, confirmed");
  console.assert(toShip >= 0, "journey: cannot ship more than was confirmed");

  const steps = [
    { key: "received", value: data.orders, note: data.pending > 0 ? fill(j.waiting, { count: data.pending }) : null, tone: "muted" },
    { key: "confirmed", value: data.confirmed, note: data.cancelled > 0 ? fill(j.cancelled, { count: data.cancelled }) : null, tone: "muted" },
    { key: "shipped", value: left, note: toShip > 0 ? fill(j.toShip, { count: toShip }) : null, tone: "muted" },
    { key: "delivered", value: data.delivered, note: data.returned > 0 ? fill(j.returned, { count: data.returned }) : null, tone: data.returned > 0 ? "bad" : "muted" },
  ] as const;

  return (
    <section className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-border">
      <h2 className="text-base font-semibold">{j.title}</h2>

      {data.orders === 0 ? (
        <p className="mt-4 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">{t.home.outcomesEmpty}</p>
      ) : (
        <ol className="mt-5 mb-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-1.5">
          {steps.map((s, i) => {
            const share = s.value / data.orders;
            return (
              <li key={s.key} className="min-w-0">
                <p className="text-sm text-muted-foreground">{j.steps[s.key]}</p>
                <p className={cn("mt-0.5 text-[28px] leading-9 font-semibold tabular-nums", s.value === 0 && "text-muted-foreground")}>
                  {s.value}
                </p>
                {/* The rung: as tall as this step's share of what was received. */}
                <div className="mt-2 flex h-20 items-end border-b border-border">
                  <div
                    className={cn("w-full rounded-t-[4px]", RUNGS[i])}
                    style={{ height: `${Math.max(share * 100, s.value > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {i === 0 ? fill(j.total, { count: data.orders }) : fill(j.ofReceived, { pct: formatPercent(share, locale) })}
                </p>
                <p className={cn("mt-0.5 min-h-4 text-xs tabular-nums", s.tone === "bad" ? "text-negative" : "text-muted-foreground")}>
                  {s.note ?? " "}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* The cash at the end of the road, and what the road cost: pinned to the card's foot. */}
      {data.orders > 0 && (
        <dl className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-md bg-border ring-1 ring-border [&>div]:bg-hue-soft">
          <div className="px-4 py-3">
            <dt className="text-xs text-hue-ink/80">{t.home.deliveredMoney}</dt>
            <dd className="mt-0.5 text-lg font-semibold text-hue-ink tabular-nums">{formatDZD(data.sales, locale)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-hue-ink/80">{j.returnCosts}</dt>
            <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", data.returnCosts > 0 ? "text-negative" : "text-muted-foreground")}>
              {formatDZD(data.returnCosts, locale)}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
