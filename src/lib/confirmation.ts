import "server-only";
import { db } from "@/lib/db";
import { toInternational } from "@/lib/phone";
import type { CallOutcome, Prisma } from "@/generated/prisma/client";

/** Orders that can still get a call outcome. */
export const CALLABLE = ["NEW", "NO_ANSWER", "CALLBACK"] as const;

const QUEUE_LIMIT = 300;

const queueSelect = {
  id: true,
  number: true,
  customerId: true,
  customerName: true,
  phone: true,
  wilayaCode: true,
  total: true,
  status: true,
  attempts: true,
  callbackAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

export type QueueItem = Prisma.OrderGetPayload<{ select: typeof queueSelect }>;

/**
 * "To confirm" queue, oldest first:
 * - NEW by order time,
 * - NO_ANSWER by last attempt (so a number that didn't answer goes to the back),
 * - CALLBACK by the scheduled time, only once it is due.
 * Callbacks not yet due are returned separately as `upcoming`.
 */
export async function getQueue(now = new Date()) {
  const [rows, upcoming] = await Promise.all([
    db.order.findMany({
      where: {
        OR: [{ status: { in: ["NEW", "NO_ANSWER"] } }, { status: "CALLBACK", callbackAt: { lte: now } }],
      },
      select: queueSelect,
      orderBy: { createdAt: "asc" },
      take: QUEUE_LIMIT,
    }),
    db.order.findMany({
      where: { status: "CALLBACK", callbackAt: { gt: now } },
      select: queueSelect,
      orderBy: { callbackAt: "asc" },
      take: 50,
    }),
  ]);
  const key = (o: QueueItem) =>
    (o.status === "CALLBACK" ? o.callbackAt! : o.status === "NO_ANSWER" ? o.updatedAt : o.createdAt).getTime();
  return { queue: rows.sort((a, b) => key(a) - key(b)), upcoming };
}

export type LogCallResult = { ok: true } | { ok: false; error: "notFound" | "notCallable" | "callbackAt" };

/** Saves one call: log row + new status + attempt counter, in one transaction. */
export async function logCall(
  orderId: string,
  outcome: CallOutcome,
  note: string | null,
  callbackAt: Date | null,
): Promise<LogCallResult> {
  if (outcome === "CALLBACK" && (!callbackAt || isNaN(callbackAt.getTime()))) return { ok: false, error: "callbackAt" };
  const now = new Date();

  return db.$transaction(async (tx) => {
    // Only update while the order is still callable (protects against double clicks / two tabs).
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: { in: [...CALLABLE] } },
      data: {
        status: outcome,
        attempts: { increment: 1 },
        callbackAt: outcome === "CALLBACK" ? callbackAt : null,
        ...(outcome === "CONFIRMED" && { confirmedAt: now }),
        ...(outcome === "CANCELLED" && { cancelledAt: now }),
      },
    });
    if (updated.count === 0) {
      const exists = await tx.order.count({ where: { id: orderId } });
      return { ok: false, error: exists ? "notCallable" : "notFound" } as const;
    }
    await tx.callLog.create({ data: { orderId, outcome, note } });
    return { ok: true } as const;
  });
}

export const TEMPLATE_PLACEHOLDERS = ["name", "store", "order", "product", "total", "wilaya"] as const;

/** wa.me link with the template filled in. */
export function whatsappUrl(phone: string, template: string, values: Record<(typeof TEMPLATE_PLACEHOLDERS)[number], string>) {
  const text = template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k as keyof typeof values] : m));
  return `https://wa.me/${toInternational(phone)}${text.trim() ? `?text=${encodeURIComponent(text)}` : ""}`;
}
