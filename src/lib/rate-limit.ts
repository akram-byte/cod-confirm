import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/*
 * Fixed-window limiter kept in the database (RateLimit table), so it holds on serverless
 * hosting (Vercel) where every request can land on a different server. One SQL statement:
 * the row is created, restarted when its window is over, or counted up.
 * If the database call fails, the request is let through: a limiter must never lose an order.
 */

/** Returns true when the key is over the limit. Counts this call. */
export async function hit(key: string, max: number, windowMs: number): Promise<boolean> {
  return (await count(key, windowMs)) > max;
}

/** True when the key already reached the limit, without counting (e.g. before checking a password). */
export async function isLimited(key: string, max: number): Promise<boolean> {
  try {
    const row = await db.rateLimit.findUnique({ where: { key } });
    return !!row && row.resetAt > new Date() && row.count >= max;
  } catch (e) {
    console.error("rate limit read failed", e);
    return false;
  }
}

/** Counts one more try for the key (e.g. a wrong password). */
export async function record(key: string, windowMs: number): Promise<void> {
  await count(key, windowMs);
}

export async function clearLimit(key: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { key } }).catch((e) => console.error("rate limit clear failed", e));
}

/** Removes finished windows. Called by the daily cron. */
export async function cleanRateLimits(): Promise<number> {
  const r = await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
  return r.count;
}

async function count(key: string, windowMs: number): Promise<number> {
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, (${resetAt.toISOString()}::timestamptz AT TIME ZONE 'UTC'))
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    return Number(rows[0]?.count ?? 0);
  } catch (e) {
    console.error("rate limit failed", e);
    return 0;
  }
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
