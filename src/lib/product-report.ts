import "server-only";
import { db } from "@/lib/db";
import { startOfDay } from "@/lib/format";
import type { DateRange } from "@/lib/stats";

/*
 * Cost per delivered order, per product, for orders placed in the range.
 *
 *   margin      = what the product sold for − what it cost (delivered orders only;
 *                 the delivery fee goes to the courier, so it is left out)
 *   returns     = return costs of this product's returned orders
 *   ads         = ad spend entered for this product (Stats → ad spend, product picked)
 *   profit      = margin − returns − ads
 *   ads per delivered order = ads ÷ delivered
 *
 * An order with two products counts for both; its return cost is split by item value.
 * General ad spend (no product picked) is not split here: it is in the total profit.
 */

export type ProductRow = {
  productId: string;
  name: string;
  orders: number;
  delivered: number;
  returned: number;
  margin: number;
  returns: number;
  ads: number;
  profit: number;
  adsPerDelivered: number | null;
  marginPerDelivered: number | null;
};

const DAY_MS = 86_400_000;

export async function getProductReport(range: Pick<DateRange, "from" | "to">): Promise<{ rows: ProductRow[]; generalAds: number }> {
  const start = startOfDay(range.from)!;
  const end = new Date(startOfDay(range.to)!.getTime() + DAY_MS);
  const adWhere = { date: { gte: new Date(`${range.from}T00:00:00Z`), lte: new Date(`${range.to}T00:00:00Z`) } };

  const [orders, productAds, general, products] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { status: true, returnCost: true, items: { select: { productId: true, productName: true, quantity: true, unitPrice: true, unitCost: true } } },
    }),
    db.productAdSpend.groupBy({ by: ["productId"], where: adWhere, _sum: { amount: true } }),
    db.adSpend.aggregate({ where: adWhere, _sum: { amount: true } }),
    db.product.findMany({ select: { id: true, name: true } }),
  ]);

  const rows = new Map<string, ProductRow>();
  const row = (id: string, name: string) => {
    let r = rows.get(id);
    if (!r) {
      r = { productId: id, name, orders: 0, delivered: 0, returned: 0, margin: 0, returns: 0, ads: 0, profit: 0, adsPerDelivered: null, marginPerDelivered: null };
      rows.set(id, r);
    }
    return r;
  };
  const names = new Map(products.map((p) => [p.id, p.name]));

  for (const o of orders) {
    const value = o.items.reduce((n, i) => n + i.quantity * i.unitPrice, 0);
    const counted = new Set<string>();
    for (const i of o.items) {
      if (!i.productId) continue; // product deleted: no campaign to compare with
      const r = row(i.productId, names.get(i.productId) ?? i.productName);
      const first = !counted.has(i.productId);
      counted.add(i.productId);
      if (first) r.orders++;
      if (o.status === "DELIVERED") {
        if (first) r.delivered++;
        r.margin += i.quantity * (i.unitPrice - i.unitCost);
      }
      if (o.status === "RETURNED") {
        if (first) r.returned++;
        r.returns += value > 0 ? Math.round((o.returnCost * i.quantity * i.unitPrice) / value) : Math.round(o.returnCost / o.items.length);
      }
    }
  }
  for (const a of productAds) {
    row(a.productId, names.get(a.productId) ?? "—").ads += a._sum.amount ?? 0;
  }

  for (const r of rows.values()) {
    r.profit = r.margin - r.returns - r.ads;
    r.adsPerDelivered = r.delivered > 0 && r.ads > 0 ? Math.round(r.ads / r.delivered) : null;
    r.marginPerDelivered = r.delivered > 0 ? Math.round(r.margin / r.delivered) : null;
  }
  return {
    rows: [...rows.values()].sort((a, b) => b.ads - a.ads || b.orders - a.orders),
    generalAds: general._sum.amount ?? 0,
  };
}
