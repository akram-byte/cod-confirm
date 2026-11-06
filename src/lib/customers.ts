import "server-only";
import { db } from "@/lib/db";

export type CustomerStats = {
  total: number;
  delivered: number;
  returned: number;
  cancelled: number;
};

export type Risk = "blacklisted" | "risky" | "ok";

// A customer is "risky" after one refused/returned parcel or two cancellations.
export const RISK_RETURNS = 1;
export const RISK_CANCELS = 2;

export function riskOf(blacklisted: boolean, s: CustomerStats): Risk {
  if (blacklisted) return "blacklisted";
  if (s.returned >= RISK_RETURNS || s.cancelled >= RISK_CANCELS) return "risky";
  return "ok";
}

const empty = (): CustomerStats => ({ total: 0, delivered: 0, returned: 0, cancelled: 0 });

/** Order counts per customer, in one grouped query. */
export async function statsFor(customerIds: string[]): Promise<Map<string, CustomerStats>> {
  const map = new Map<string, CustomerStats>();
  if (customerIds.length === 0) return map;
  const groups = await db.order.groupBy({
    by: ["customerId", "status"],
    where: { customerId: { in: customerIds } },
    _count: { _all: true },
  });
  for (const g of groups) {
    const s = map.get(g.customerId) ?? empty();
    const n = g._count._all;
    s.total += n;
    if (g.status === "DELIVERED") s.delivered += n;
    if (g.status === "RETURNED") s.returned += n;
    if (g.status === "CANCELLED") s.cancelled += n;
    map.set(g.customerId, s);
  }
  return map;
}

/** Risk per customer id (for badges on orders). */
export async function risksFor(customerIds: string[]): Promise<Map<string, Risk>> {
  const ids = [...new Set(customerIds)];
  const [stats, customers] = await Promise.all([
    statsFor(ids),
    db.customer.findMany({ where: { id: { in: ids } }, select: { id: true, blacklisted: true } }),
  ]);
  return new Map(customers.map((c) => [c.id, riskOf(c.blacklisted, stats.get(c.id) ?? empty())]));
}
