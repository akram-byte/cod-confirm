import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getWilaya } from "@/lib/algeria";
import { moveOrders } from "@/lib/delivery";
import { demoCourier } from "./demo";
import { yalidineCourier } from "./yalidine";
import { zrexpressCourier } from "./zrexpress";
import type { Courier, Desk, ParcelInput } from "./types";

export type { Desk } from "./types";

/** The courier set by COURIER in .env, or null when the seller exports Excel by hand. */
export function getCourier(): Courier | null {
  const name = process.env.COURIER;
  if (name === "yalidine") return yalidineCourier;
  if (name === "zrexpress") return zrexpressCourier;
  if (name === "demo") return demoCourier;
  return null;
}

export type SendResult = {
  sent: number;
  failed: { number: number; reason: "needDesk" | "alreadySent" | "notConfirmed" | "courier"; message?: string }[];
};

/** Creates parcels for confirmed orders and moves them to SHIPPED with their tracking number. */
export async function sendToCourier(ids: string[]): Promise<SendResult> {
  const courier = getCourier();
  if (!courier) throw new Error("No courier configured");
  const orders = await db.order.findMany({
    where: { id: { in: ids } },
    include: { items: { select: { productName: true, quantity: true } } },
    orderBy: { number: "asc" },
  });

  const result: SendResult = { sent: 0, failed: [] };
  const inputs: ParcelInput[] = [];
  for (const o of orders) {
    if (o.status !== "CONFIRMED") result.failed.push({ number: o.number, reason: "notConfirmed" });
    else if (o.courier) result.failed.push({ number: o.number, reason: "alreadySent" });
    else if (o.deliveryType === "DESK" && o.stopDeskId === null) result.failed.push({ number: o.number, reason: "needDesk" });
    else {
      const [first, ...rest] = o.customerName.trim().split(/\s+/);
      const w = getWilaya(o.wilayaCode);
      const commune = w?.communes.find((c) => c.id === o.communeId);
      inputs.push({
        orderId: o.id,
        firstname: first,
        familyname: rest.join(" ") || first,
        phone: o.phone,
        address: o.address ?? "",
        wilayaCode: o.wilayaCode,
        wilayaName: w?.nameFr ?? String(o.wilayaCode),
        communeName: commune?.nameFr ?? o.communeName,
        products: o.items.map((i) => (i.quantity > 1 ? `${i.productName} x${i.quantity}` : i.productName)).join(", "),
        amount: o.total,
        stopDeskId: o.deliveryType === "DESK" ? o.stopDeskId : null,
      });
    }
  }
  if (inputs.length === 0) return result;

  const created = await courier.createParcels(inputs);
  const numberOf = new Map(orders.map((o) => [o.id, o.number]));
  const now = new Date();
  for (const r of created) {
    if (!r.ok) {
      result.failed.push({ number: numberOf.get(r.orderId)!, reason: "courier", message: r.message });
      continue;
    }
    // Guarded on CONFIRMED + no courier yet, so a double click never ships twice in our records.
    const u = await db.order.updateMany({
      where: { id: r.orderId, status: "CONFIRMED", courier: null },
      data: {
        status: "SHIPPED",
        shippedAt: now,
        courier: courier.name,
        trackingNumber: r.tracking,
        labelUrl: r.labelUrl,
        courierStatus: null,
      },
    });
    result.sent += u.count;
  }
  return result;
}

/**
 * Reads the status of every parcel on the road and closes the ones the courier
 * delivered or returned. Returns how many orders changed to DELIVERED / RETURNED.
 */
export async function syncCourier(): Promise<{ checked: number; delivered: number; returned: number }> {
  const courier = getCourier();
  if (!courier) return { checked: 0, delivered: 0, returned: 0 };
  const orders = await db.order.findMany({
    where: { status: "SHIPPED", courier: courier.name, trackingNumber: { not: null } },
    select: { id: true, trackingNumber: true, shippedAt: true, updatedAt: true, courierStatus: true },
  });
  const byTracking = new Map(orders.map((o) => [o.trackingNumber!, o]));
  const states = await courier.getStates(orders.map((o) => ({ tracking: o.trackingNumber!, sentAt: o.shippedAt ?? o.updatedAt })));

  const delivered: string[] = [];
  const returned: string[] = [];
  for (const s of states) {
    const o = byTracking.get(s.tracking);
    if (!o) continue;
    if (s.status !== o.courierStatus) {
      await db.order.updateMany({ where: { id: o.id, status: "SHIPPED" }, data: { courierStatus: s.status } });
    }
    if (s.outcome === "DELIVERED") delivered.push(o.id);
    if (s.outcome === "RETURNED") returned.push(o.id);
  }
  const [d, r] = await Promise.all([moveOrders(delivered, "DELIVERED"), moveOrders(returned, "RETURNED")]);
  await db.settings.update({ where: { id: 1 }, data: { courierSyncedAt: new Date() } });
  return { checked: orders.length, delivered: d, returned: r };
}

export async function desksFor(wilayaCode: number): Promise<Desk[]> {
  const courier = getCourier();
  const w = getWilaya(wilayaCode);
  if (!courier || !w) return [];
  return courier.getDesks(w.code, w.nameFr);
}

/** Saves the courier office for a DESK order (checked against the courier's own list). */
export async function setStopDesk(orderId: string, deskId: string): Promise<boolean> {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { wilayaCode: true, status: true } });
  if (!order || order.status !== "CONFIRMED") return false;
  const desk = (await desksFor(order.wilayaCode)).find((d) => d.id === deskId);
  if (!desk) return false;
  await db.order.update({ where: { id: orderId }, data: { stopDeskId: desk.id, stopDeskName: desk.name } });
  return true;
}

const AUTO_SYNC_MS = 10 * 60_000;

/** Statuses refresh on their own at most every 10 minutes, after the page is sent (no waiting). */
export function syncInBackgroundIfStale(syncedAt: Date | null) {
  if (!getCourier() || (syncedAt && Date.now() - syncedAt.getTime() < AUTO_SYNC_MS)) return;
  after(() => syncCourier().catch((e) => console.error("auto courier sync failed", e)));
}
