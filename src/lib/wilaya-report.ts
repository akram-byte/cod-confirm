import "server-only";
import { db } from "@/lib/db";
import { startOfDay } from "@/lib/format";

/*
 * Returns by wilaya, for orders placed in the date range (same basis as the stats page).
 * Only finished parcels count (delivered or returned): parcels still on the road are left out.
 *
 *   return rate = returned / (delivered + returned), also split home / stop desk
 *   loss        = return costs of returned parcels
 *   net         = delivered (total − product cost − delivery fee) − return costs   (before ads)
 */

const DAY_MS = 86_400_000;

/** Below this many finished parcels a wilaya's rate is too noisy to act on. */
export const MIN_PARCELS = 5;
/** Home return rate from which we suggest stop desk only. */
export const BAD_RETURN_RATE = 0.3;

export type WilayaRow = {
  wilayaCode: number;
  delivered: number;
  returned: number;
  homeDelivered: number;
  homeReturned: number;
  deskDelivered: number;
  deskReturned: number;
  loss: number;
  net: number;
  deskOnly: boolean;
  /** false = this wilaya has no delivery fee row (can't be switched). */
  hasFee: boolean;
};

const rate = (a: number, b: number) => (b > 0 ? a / b : null);

export const returnRate = (r: WilayaRow) => rate(r.returned, r.delivered + r.returned);
export const homeReturnRate = (r: WilayaRow) => rate(r.homeReturned, r.homeDelivered + r.homeReturned);
export const deskReturnRate = (r: WilayaRow) => rate(r.deskReturned, r.deskDelivered + r.deskReturned);

/** Enough home parcels, too many come back, and home delivery is still on. */
export function suggestDeskOnly(r: WilayaRow) {
  const home = r.homeDelivered + r.homeReturned;
  const hr = homeReturnRate(r);
  return !r.deskOnly && r.hasFee && home >= MIN_PARCELS && hr !== null && hr >= BAD_RETURN_RATE;
}

export async function getWilayaReport(range: { from: string; to: string }): Promise<WilayaRow[]> {
  const start = startOfDay(range.from)!;
  const end = new Date(startOfDay(range.to)!.getTime() + DAY_MS);

  const [orders, fees] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { in: ["DELIVERED", "RETURNED"] } },
      select: {
        wilayaCode: true,
        deliveryType: true,
        status: true,
        total: true,
        deliveryFee: true,
        returnCost: true,
        items: { select: { quantity: true, unitCost: true } },
      },
    }),
    db.deliveryFee.findMany({ select: { wilayaCode: true, deskOnly: true } }),
  ]);
  const feeMap = new Map(fees.map((f) => [f.wilayaCode, f.deskOnly]));

  const rows = new Map<number, WilayaRow>();
  for (const o of orders) {
    let r = rows.get(o.wilayaCode);
    if (!r) {
      r = {
        wilayaCode: o.wilayaCode,
        delivered: 0,
        returned: 0,
        homeDelivered: 0,
        homeReturned: 0,
        deskDelivered: 0,
        deskReturned: 0,
        loss: 0,
        net: 0,
        deskOnly: feeMap.get(o.wilayaCode) ?? false,
        hasFee: feeMap.has(o.wilayaCode),
      };
      rows.set(o.wilayaCode, r);
    }
    const home = o.deliveryType === "HOME";
    if (o.status === "DELIVERED") {
      const cost = o.items.reduce((n, i) => n + i.quantity * i.unitCost, 0);
      r.delivered++;
      if (home) r.homeDelivered++;
      else r.deskDelivered++;
      r.net += o.total - cost - o.deliveryFee;
    } else {
      r.returned++;
      if (home) r.homeReturned++;
      else r.deskReturned++;
      r.loss += o.returnCost;
      r.net -= o.returnCost;
    }
  }

  // Worst first: biggest loss, then most returns.
  return [...rows.values()].sort((a, b) => b.loss - a.loss || b.returned - a.returned || a.wilayaCode - b.wilayaCode);
}
