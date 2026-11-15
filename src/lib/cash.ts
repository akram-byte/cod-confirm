import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/*
 * Courier cash check. In COD the courier collects the money and pays the seller later,
 * minus its fees. For each delivered parcel the seller should get the order total minus
 * the delivery fee; a returned parcel costs its return fee. The seller records each
 * payment received and ticks the parcels it covers; anything missing or late shows up.
 */

export const LATE_DAYS = 7;
const LIMIT = 500;

const unpaidSelect = {
  id: true,
  number: true,
  customerName: true,
  status: true,
  total: true,
  deliveryFee: true,
  returnCost: true,
  deliveredAt: true,
  returnedAt: true,
  trackingNumber: true,
} satisfies Prisma.OrderSelect;

type UnpaidOrder = Prisma.OrderGetPayload<{ select: typeof unpaidSelect }>;

/** What the courier collected from the customer for this parcel. */
export const collectedOf = (o: Pick<UnpaidOrder, "status" | "total">) => (o.status === "DELIVERED" ? o.total : 0);

/** What the seller should receive for this parcel (negative for a return fee). */
export const expectedOf = (o: Pick<UnpaidOrder, "status" | "total" | "deliveryFee" | "returnCost">) =>
  o.status === "DELIVERED" ? o.total - o.deliveryFee : -o.returnCost;

/** Paid late: delivered or returned more than LATE_DAYS ago and still not paid. */
export const isLate = (at: Date | null, now = Date.now()) => !!at && at.getTime() < now - LATE_DAYS * 86_400_000;

export const closedAt = (o: Pick<UnpaidOrder, "deliveredAt" | "returnedAt">) => o.deliveredAt ?? o.returnedAt;

/** Delivered and returned parcels the courier has not paid yet, oldest first. */
export async function getUnpaid() {
  const where = { status: { in: ["DELIVERED", "RETURNED"] }, payoutId: null } satisfies Prisma.OrderWhereInput;
  const [orders, total] = await Promise.all([
    db.order.findMany({ where, select: unpaidSelect, orderBy: { number: "asc" }, take: LIMIT }),
    db.order.count({ where }),
  ]);
  orders.sort((a, b) => (closedAt(a)?.getTime() ?? 0) - (closedAt(b)?.getTime() ?? 0));
  return { orders, total };
}

export function getPayouts() {
  return db.payout.findMany({
    orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { _count: { select: { orders: true } } },
  });
}

/**
 * Saves a payment from the courier for the given parcels. Parcels already paid
 * (other tab, double click) are skipped. Returns null when nothing was left to pay.
 */
export async function recordPayout(ids: string[], amount: number, receivedAt: Date, note: string | null) {
  return db.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: { id: { in: ids }, status: { in: ["DELIVERED", "RETURNED"] }, payoutId: null },
      select: unpaidSelect,
    });
    if (orders.length === 0) return null;
    const payout = await tx.payout.create({
      data: {
        amount,
        receivedAt,
        note,
        expected: orders.reduce((s, o) => s + expectedOf(o), 0),
        collected: orders.reduce((s, o) => s + collectedOf(o), 0),
      },
    });
    await tx.order.updateMany({ where: { id: { in: orders.map((o) => o.id) }, payoutId: null }, data: { payoutId: payout.id } });
    return { count: orders.length, difference: amount - payout.expected };
  });
}

/** Removes a payment entered by mistake; its parcels go back to "not paid yet". */
export async function deletePayout(id: string) {
  const r = await db.payout.deleteMany({ where: { id } });
  return r.count > 0;
}
