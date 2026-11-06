import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";

export const DELIVERY_TABS = ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"] as const;
export type DeliveryTab = (typeof DELIVERY_TABS)[number];

/** Allowed moves on the delivery page: target → statuses it can come from. */
export const DELIVERY_MOVES = {
  SHIPPED: ["CONFIRMED", "DELIVERED", "RETURNED"], // ship, or undo a mistaken delivered/returned
  DELIVERED: ["SHIPPED"],
  RETURNED: ["SHIPPED"],
} as const satisfies Partial<Record<OrderStatus, readonly OrderStatus[]>>;
export type DeliveryMove = keyof typeof DELIVERY_MOVES;

/**
 * Moves many orders at once. Orders whose status no longer allows the move are
 * left alone (e.g. changed in another tab). Returns how many were updated.
 */
export async function moveOrders(ids: string[], to: DeliveryMove): Promise<number> {
  if (ids.length === 0) return 0;
  const now = new Date();

  if (to === "RETURNED") {
    // The lost delivery fee is counted as the return cost (used for profit).
    return db.$executeRaw`
      UPDATE "Order"
      SET "status" = 'RETURNED'::"OrderStatus", "returnedAt" = ${now}, "returnCost" = "deliveryFee", "updatedAt" = ${now}
      WHERE "id" = ANY(${ids}) AND "status" = 'SHIPPED'::"OrderStatus"`;
  }

  if (to === "DELIVERED") {
    const r = await db.order.updateMany({
      where: { id: { in: ids }, status: "SHIPPED" },
      data: { status: "DELIVERED", deliveredAt: now },
    });
    return r.count;
  }

  // SHIPPED: ship confirmed orders, or put back delivered/returned ones.
  const [shipped, undone] = await db.$transaction([
    db.order.updateMany({
      where: { id: { in: ids }, status: "CONFIRMED" },
      data: { status: "SHIPPED", shippedAt: now },
    }),
    db.order.updateMany({
      where: { id: { in: ids }, status: { in: ["DELIVERED", "RETURNED"] } },
      data: { status: "SHIPPED", deliveredAt: null, returnedAt: null, returnCost: 0 },
    }),
  ]);
  return shipped.count + undone.count;
}

export async function setTracking(id: string, tracking: string) {
  await db.order.update({ where: { id }, data: { trackingNumber: tracking || null } });
}
