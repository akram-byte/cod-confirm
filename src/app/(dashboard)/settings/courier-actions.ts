"use server";

import { requireOwner } from "@/lib/auth";
import { getCourier, type CourierCheck } from "@/lib/courier";

export type CourierCheckState = { ok: true; result: CourierCheck } | { ok: false; message: string };

/** Read-only: reads the courier's lists with the keys from .env. Creates nothing at the courier. */
export async function checkCourierConnection(): Promise<CourierCheckState> {
  await requireOwner();
  const courier = getCourier();
  if (!courier) return { ok: false, message: "COURIER" };
  try {
    return { ok: true, result: await courier.check() };
  } catch (e) {
    console.error("courier check failed", e);
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
