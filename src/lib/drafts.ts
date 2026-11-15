import "server-only";
import { db } from "@/lib/db";
import type { DraftStatus, Prisma } from "@/generated/prisma/client";

/*
 * Abandoned orders. The order form saves what the customer typed as soon as the phone
 * number is valid. If no order follows, the seller sees it here and calls back: the ad
 * money that brought this person is already spent.
 * Drafts are kept 30 days at most (customer data, law 18-07), see deleteOldDrafts.
 */

/** Give the customer time to finish the form before showing it as abandoned. */
export const ABANDON_AFTER_MS = 20 * 60_000;
const SHOW_DAYS = 7;
const KEEP_DAYS = 30;
const DAY_MS = 86_400_000;

export const OPEN_STATUSES = ["OPEN", "NO_ANSWER"] as const satisfies DraftStatus[];

export type DraftInput = {
  token: string;
  productId: string;
  phone: string;
  customerName: string | null;
  wilayaCode: number | null;
  communeId: number | null;
  quantity: number;
};

/** Creates or updates the draft of one form visit. Never touches a draft that already became an order. */
export async function saveDraft(d: DraftInput) {
  const product = await db.product.findFirst({ where: { id: d.productId, active: true }, select: { id: true } });
  if (!product) return;
  const data = {
    phone: d.phone,
    customerName: d.customerName,
    wilayaCode: d.wilayaCode,
    communeId: d.communeId,
    quantity: d.quantity,
  };
  const existing = await db.orderDraft.findUnique({ where: { token: d.token }, select: { status: true } });
  if (existing) {
    if (existing.status === "OPEN") await db.orderDraft.update({ where: { token: d.token }, data });
    return;
  }
  // The last save can land just after the order was sent: don't count it as abandoned.
  const justOrdered = await db.order.findFirst({
    where: { phone: d.phone, createdAt: { gt: new Date(Date.now() - 10 * 60_000) }, items: { some: { productId: d.productId } } },
    select: { id: true },
  });
  if (justOrdered) return;
  await db.orderDraft.create({ data: { ...data, token: d.token, productId: d.productId } });
}

/** Called when an order is created: the matching drafts are no longer abandoned. */
export async function closeDrafts(
  tx: Prisma.TransactionClient | typeof db,
  phone: string,
  productId: string,
  orderId: string,
  source: "FORM" | "MANUAL",
) {
  await tx.orderDraft.updateMany({
    where: { phone, productId, status: { in: [...OPEN_STATUSES] } },
    data: { status: source === "FORM" ? "ORDERED" : "RECOVERED", orderId },
  });
}

/** Abandoned orders to call: new ones first (oldest first), then the ones that did not answer. */
export async function getAbandoned(now = Date.now()) {
  const drafts = await db.orderDraft.findMany({
    where: {
      status: { in: [...OPEN_STATUSES] },
      updatedAt: { lt: new Date(now - ABANDON_AFTER_MS), gt: new Date(now - SHOW_DAYS * DAY_MS) },
    },
    include: { product: { select: { name: true, price: true } } },
    orderBy: { updatedAt: "asc" },
    take: 200,
  });
  if (drafts.length === 0) return [];
  // Hide people who ordered anyway (another product, another device…) around or after the draft.
  const orders = await db.order.findMany({
    where: { phone: { in: [...new Set(drafts.map((d) => d.phone))] }, createdAt: { gte: new Date(now - SHOW_DAYS * DAY_MS) } },
    select: { phone: true, createdAt: true },
  });
  const ordered = (d: (typeof drafts)[number]) =>
    orders.some((o) => o.phone === d.phone && o.createdAt.getTime() >= d.createdAt.getTime() - 3_600_000);
  // One line per phone + product (the same person may open the form several times).
  const seen = new Set<string>();
  const list = drafts
    .filter((d) => !ordered(d))
    .reverse()
    .filter((d) => {
      const key = `${d.phone}:${d.productId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .reverse();
  return list.sort((a, b) => Number(a.status === "NO_ANSWER") - Number(b.status === "NO_ANSWER"));
}

/** Seller's call result. "No answer" keeps it in the list; "not interested" closes it (with the same phone + product). */
export async function markDraft(id: string, result: "NO_ANSWER" | "DISMISSED") {
  const d = await db.orderDraft.findUnique({ where: { id }, select: { phone: true, productId: true } });
  if (!d) return false;
  const r = await db.orderDraft.updateMany({
    where: { phone: d.phone, productId: d.productId, status: { in: [...OPEN_STATUSES] } },
    data: { status: result, attempts: { increment: 1 } },
  });
  return r.count > 0;
}

export function getDraft(id: string) {
  return db.orderDraft.findFirst({ where: { id, status: { in: [...OPEN_STATUSES] } } });
}

/** Run daily: abandoned forms are personal data, keep them 30 days at most. */
export async function deleteOldDrafts(now = Date.now()) {
  const r = await db.orderDraft.deleteMany({ where: { createdAt: { lt: new Date(now - KEEP_DAYS * DAY_MS) } } });
  return r.count;
}
