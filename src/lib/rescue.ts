import "server-only";
import { db } from "@/lib/db";
import type { RescueResult } from "@/generated/prisma/client";

/*
 * "Save the parcel": when the courier could not deliver (customer absent, no answer,
 * postponed…), the seller calls the customer the same day so the parcel is delivered
 * instead of coming back (a return costs the delivery fee and the sale).
 */

export const RESCUE_LIMIT = 200;

/** Shipped parcels waiting for the seller's call: new failures first (oldest first), then "no answer" ones. */
export async function getRescueQueue() {
  const rows = await db.order.findMany({
    where: { status: "SHIPPED", rescueOpen: true },
    include: { items: { select: { productName: true, quantity: true } } },
    orderBy: { failedAt: "asc" },
    take: RESCUE_LIMIT,
  });
  const key = (o: (typeof rows)[number]) => (o.rescueResult === "NO_ANSWER" ? 1 : 0);
  return rows.sort((a, b) => key(a) - key(b));
}

export function countRescue() {
  return db.order.count({ where: { status: "SHIPPED", rescueOpen: true } });
}

/**
 * Saves the call result. "No answer" keeps the parcel in the queue (to the back);
 * "Will receive" and "Refuses" close it until the courier reports a new failed try.
 */
export async function recordRescue(orderId: string, result: RescueResult, note: string | null) {
  const u = await db.order.updateMany({
    where: { id: orderId, status: "SHIPPED", rescueOpen: true },
    data: {
      rescueResult: result,
      rescueOpen: result === "NO_ANSWER",
      rescueCalls: { increment: 1 },
      rescuedAt: new Date(),
      ...(note && { rescueNote: note }),
    },
  });
  return u.count > 0;
}

/** For sellers without a courier API: the seller marks shipped parcels as "failed try" by hand. */
export async function markFailed(ids: string[]) {
  const u = await db.order.updateMany({
    where: { id: { in: ids }, status: "SHIPPED" },
    data: { failedAt: new Date(), rescueOpen: true, rescueResult: null },
  });
  return u.count;
}
