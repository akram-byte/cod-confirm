import "server-only";
import { db } from "@/lib/db";
import { TIME_ZONE, TZ_OFFSET, startOfDay } from "@/lib/format";

/*
 * All numbers are for ORDERS PLACED in the date range (by order date), so the ad
 * spend of those days is compared with the orders it brought in.
 *
 *   confirmation rate = confirmed / (confirmed + cancelled)      — orders still being called are left out
 *   delivery rate     = delivered / (delivered + returned)       — parcels still on the road are left out
 *   return rate       = returned  / (delivered + returned)
 *   profit = delivered sales − product cost − delivery fees − return costs − ad spend
 *
 * "Delivered sales" is what the customer paid (product + delivery fee); the delivery
 * fee goes to the courier, so it is subtracted again.
 */

const DAY_MS = 86_400_000;
const MAX_DAYS = 366;

/** "YYYY-MM-DD" of a moment, in Algiers time. */
export function dayKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function todayKey() {
  return dayKey(new Date());
}

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00${TZ_OFFSET}`);
  return dayKey(new Date(d.getTime() + n * DAY_MS));
}

export type RangePreset = "today" | "7d" | "30d" | "month" | "custom";
export type DateRange = { from: string; to: string; preset: RangePreset };

/** Reads ?range=7d or ?from=…&to=… (inclusive days). Default: last 30 days. */
export function parseRange(sp: Record<string, string | string[] | undefined>): DateRange {
  const today = todayKey();
  const preset = typeof sp.range === "string" ? sp.range : "";
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";
  if (preset === "today") return { from: today, to: today, preset };
  if (preset === "7d") return { from: addDays(today, -6), to: today, preset };
  if (preset === "month") return { from: `${today.slice(0, 8)}01`, to: today, preset };
  if (startOfDay(from) && startOfDay(to)) {
    const b = from <= to ? to : from;
    const a = from <= to ? from : to;
    return { from: addDays(a, MAX_DAYS) < b ? addDays(b, -MAX_DAYS) : a, to: b, preset: "custom" };
  }
  return { from: addDays(today, -29), to: today, preset: "30d" };
}

export type DayPoint = {
  day: string;
  orders: number;
  confirmed: number;
  delivered: number;
  returned: number;
  adSpend: number;
  profit: number;
};

export type Stats = {
  orders: number;
  pending: number;
  confirmed: number; // reached CONFIRMED or later
  cancelled: number;
  shipped: number; // still on the road
  delivered: number;
  returned: number;
  confirmationRate: number | null;
  deliveryRate: number | null;
  returnRate: number | null;
  sales: number;
  productCost: number;
  deliveryFees: number;
  returnCosts: number;
  adSpend: number;
  profit: number;
  days: DayPoint[];
};

const rate = (a: number, b: number) => (b > 0 ? a / b : null);

export async function getStats(range: Pick<DateRange, "from" | "to">): Promise<Stats> {
  const start = startOfDay(range.from)!;
  const end = new Date(startOfDay(range.to)!.getTime() + DAY_MS);

  const [orders, ads] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        createdAt: true,
        status: true,
        total: true,
        deliveryFee: true,
        returnCost: true,
        items: { select: { quantity: true, unitCost: true } },
      },
    }),
    // AdSpend.date is a calendar day stored at UTC midnight.
    db.adSpend.findMany({
      where: { date: { gte: new Date(`${range.from}T00:00:00Z`), lte: new Date(`${range.to}T00:00:00Z`) } },
      select: { date: true, amount: true },
    }),
  ]);

  const days = new Map<string, DayPoint>();
  for (let k = range.from; k <= range.to; k = addDays(k, 1)) {
    days.set(k, { day: k, orders: 0, confirmed: 0, delivered: 0, returned: 0, adSpend: 0, profit: 0 });
  }

  const s: Stats = {
    orders: orders.length,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    confirmationRate: null,
    deliveryRate: null,
    returnRate: null,
    sales: 0,
    productCost: 0,
    deliveryFees: 0,
    returnCosts: 0,
    adSpend: 0,
    profit: 0,
    days: [],
  };

  for (const o of orders) {
    const d = days.get(dayKey(o.createdAt));
    if (d) d.orders++;
    switch (o.status) {
      case "NEW":
      case "NO_ANSWER":
      case "CALLBACK":
        s.pending++;
        break;
      case "CANCELLED":
        s.cancelled++;
        break;
      default: {
        s.confirmed++;
        if (d) d.confirmed++;
        if (o.status === "SHIPPED") s.shipped++;
        if (o.status === "DELIVERED") {
          const cost = o.items.reduce((n, i) => n + i.quantity * i.unitCost, 0);
          s.delivered++;
          s.sales += o.total;
          s.productCost += cost;
          s.deliveryFees += o.deliveryFee;
          if (d) {
            d.delivered++;
            d.profit += o.total - cost - o.deliveryFee;
          }
        }
        if (o.status === "RETURNED") {
          s.returned++;
          s.returnCosts += o.returnCost;
          if (d) {
            d.returned++;
            d.profit -= o.returnCost;
          }
        }
      }
    }
  }

  for (const a of ads) {
    s.adSpend += a.amount;
    const d = days.get(a.date.toISOString().slice(0, 10));
    if (d) {
      d.adSpend += a.amount;
      d.profit -= a.amount;
    }
  }

  s.confirmationRate = rate(s.confirmed, s.confirmed + s.cancelled);
  s.deliveryRate = rate(s.delivered, s.delivered + s.returned);
  s.returnRate = rate(s.returned, s.delivered + s.returned);
  s.profit = s.sales - s.productCost - s.deliveryFees - s.returnCosts - s.adSpend;
  s.days = [...days.values()];
  return s;
}
