import "server-only";
import { headers } from "next/headers";

// Simple in-memory fixed-window limiter. Good enough for one seller on one server.
const buckets = new Map<string, { count: number; first: number }>();

/** Returns true when the key is over the limit. Counts this call. */
export function hit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.first > windowMs) {
    buckets.set(key, { count: 1, first: now });
    return false;
  }
  b.count++;
  return b.count > max;
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
