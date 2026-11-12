"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { moveOrders, setTracking } from "@/lib/delivery";
import { desksFor, sendToCourier, setStopDesk, syncCourier } from "@/lib/courier";

const moveSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(1000),
  to: z.enum(["SHIPPED", "DELIVERED", "RETURNED"]),
});

export async function moveDeliveryOrders(ids: string[], to: string) {
  await requireOwner();
  const parsed = moveSchema.safeParse({ ids, to });
  if (!parsed.success) return { ok: false as const };
  try {
    const count = await moveOrders(parsed.data.ids, parsed.data.to);
    revalidatePath("/", "layout");
    return { ok: true as const, count, skipped: parsed.data.ids.length - count };
  } catch (e) {
    console.error("delivery move failed", e);
    return { ok: false as const };
  }
}

export async function saveTracking(id: string, tracking: string) {
  await requireOwner();
  const parsed = z.string().trim().max(60).safeParse(tracking);
  if (!parsed.success) return { ok: false };
  try {
    await setTracking(id, parsed.data);
    revalidatePath("/delivery");
    return { ok: true };
  } catch (e) {
    console.error("save tracking failed", e);
    return { ok: false };
  }
}

export async function sendOrdersToCourier(ids: string[]) {
  await requireOwner();
  const parsed = z.array(z.string().min(1)).min(1).max(500).safeParse(ids);
  if (!parsed.success) return { ok: false as const };
  try {
    const result = await sendToCourier(parsed.data);
    revalidatePath("/", "layout");
    return { ok: true as const, ...result };
  } catch (e) {
    console.error("send to courier failed", e);
    return { ok: false as const };
  }
}

export async function refreshCourierStatuses() {
  await requireOwner();
  try {
    const result = await syncCourier();
    revalidatePath("/", "layout");
    return { ok: true as const, ...result };
  } catch (e) {
    console.error("courier sync failed", e);
    return { ok: false as const };
  }
}

export async function loadDesks(wilayaCode: number) {
  await requireOwner();
  try {
    return { ok: true as const, desks: await desksFor(Number(wilayaCode)) };
  } catch (e) {
    console.error("load desks failed", e);
    return { ok: false as const, desks: [] };
  }
}

export async function chooseDesk(orderId: string, deskId: string) {
  await requireOwner();
  try {
    const ok = await setStopDesk(String(orderId), String(deskId));
    if (ok) revalidatePath("/delivery");
    return { ok };
  } catch (e) {
    console.error("choose desk failed", e);
    return { ok: false };
  }
}
