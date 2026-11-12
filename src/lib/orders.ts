import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getCommune, getWilaya } from "@/lib/algeria";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "NO_ANSWER",
  "CALLBACK",
  "CANCELLED",
  "SHIPPED",
  "DELIVERED",
  "RETURNED",
] as const satisfies readonly OrderStatus[];

const DAY_MS = 24 * 60 * 60 * 1000;

// Shared by the public form and the dashboard form.
export const orderInputSchema = z.object({
  productId: z.string().min(1, "product"),
  quantity: z.coerce.number().int().min(1, "quantity").max(20, "quantity"),
  customerName: z.string().trim().min(2, "name").max(80, "name"),
  phone: z
    .string()
    .transform((v) => normalizePhone(v) ?? "")
    .pipe(z.string().min(1, "phone")),
  wilayaCode: z.coerce
    .number()
    .int()
    .refine((c) => !!getWilaya(c), "wilaya"),
  communeId: z.coerce.number().int().min(1, "commune"),
  deliveryType: z.enum(["HOME", "DESK"]),
  address: z.string().trim().max(200).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type FieldErrors = Partial<Record<keyof OrderInput, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof OrderInput;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Fee charged to the customer, or null when we don't deliver to that wilaya. */
export async function deliveryFeeFor(wilayaCode: number, type: "HOME" | "DESK") {
  const fee = await db.deliveryFee.findUnique({ where: { wilayaCode } });
  if (!fee || !fee.active) return null;
  return type === "HOME" ? fee.homeFee : fee.deskFee;
}

/** Active wilaya fees as a plain object, for the client-side forms. */
export async function feeTable(): Promise<Record<number, { home: number; desk: number }>> {
  const fees = await db.deliveryFee.findMany({ where: { active: true } });
  return Object.fromEntries(fees.map((f) => [f.wilayaCode, { home: f.homeFee, desk: f.deskFee }]));
}

/** Same phone ordered the same product in the last 24h (ignoring `excludeId`). */
export async function findDuplicate(phone: string, productId: string, excludeId?: string) {
  return db.order.findFirst({
    where: {
      phone,
      id: excludeId ? { not: excludeId } : undefined,
      createdAt: { gte: new Date(Date.now() - DAY_MS) },
      items: { some: { productId } },
    },
    select: { id: true, number: true },
    orderBy: { createdAt: "desc" },
  });
}

type SaveError = "product" | "commune" | "wilaya";

/** Checks product, commune and delivery fee. Returns the computed values or an error key. */
async function resolve(input: OrderInput, opts: { allowInactiveProduct?: boolean; feeOverride?: number }) {
  const commune = getCommune(input.wilayaCode, input.communeId);
  if (!commune) return { error: "commune" as SaveError };
  const [product, autoFee] = await Promise.all([
    db.product.findUnique({ where: { id: input.productId } }),
    deliveryFeeFor(input.wilayaCode, input.deliveryType),
  ]);
  if (!product || (!product.active && !opts.allowInactiveProduct)) return { error: "product" as SaveError };
  if (autoFee === null && opts.feeOverride === undefined) return { error: "wilaya" as SaveError };
  const deliveryFee = opts.feeOverride ?? autoFee ?? 0;
  const subtotal = product.price * input.quantity;
  return { product, commune, deliveryFee, subtotal, total: subtotal + deliveryFee };
}

export async function createOrder(
  input: OrderInput,
  source: "FORM" | "MANUAL",
  opts: { feeOverride?: number } = {},
): Promise<{ error: SaveError } | { id: string; number: number; total: number; duplicate: boolean }> {
  const [r, dup] = await Promise.all([
    resolve(input, { feeOverride: opts.feeOverride }),
    findDuplicate(input.phone, input.productId),
  ]);
  if ("error" in r) return { error: r.error! };
  const { product, commune, deliveryFee, subtotal, total } = r;
  const duplicate = !!dup;

  // One nested write: finds or creates the customer by phone, then the order + item.
  const order = await db.order.create({
    data: {
      customer: {
        connectOrCreate: {
          where: { phone: input.phone },
          create: { phone: input.phone, name: input.customerName },
        },
      },
      customerName: input.customerName,
      phone: input.phone,
      wilayaCode: input.wilayaCode,
      communeId: commune.id,
      communeName: commune.nameAr,
      address: input.address || null,
      deliveryType: input.deliveryType,
      deliveryFee,
      subtotal,
      total,
      source,
      duplicate,
      note: input.note || null,
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            quantity: input.quantity,
            unitPrice: product.price,
            unitCost: product.cost,
          },
        ],
      },
    },
    select: { id: true, number: true },
  });
  return { ...order, total, duplicate };
}

/** Dashboard edit. Keeps the price snapshot when the product does not change. */
export async function updateOrder(id: string, input: OrderInput, feeOverride: number) {
  const existing = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return { error: "notFound" as const };
  const r = await resolve(input, { allowInactiveProduct: true, feeOverride });
  if ("error" in r) return { error: r.error! };
  const { product, commune, deliveryFee } = r;

  const old = existing.items[0];
  const sameProduct = old?.productId === product.id;
  const unitPrice = sameProduct ? old.unitPrice : product.price;
  const unitCost = sameProduct ? old.unitCost : product.cost;
  const subtotal = unitPrice * input.quantity;

  await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone: input.phone },
      update: { name: input.customerName },
      create: { phone: input.phone, name: input.customerName },
    });
    await tx.orderItem.deleteMany({ where: { orderId: id } });
    await tx.order.update({
      where: { id },
      data: {
        customerId: customer.id,
        customerName: input.customerName,
        phone: input.phone,
        wilayaCode: input.wilayaCode,
        communeId: commune.id,
        communeName: commune.nameAr,
        address: input.address || null,
        deliveryType: input.deliveryType,
        deliveryFee,
        subtotal,
        total: subtotal + deliveryFee,
        note: input.note || null,
        items: {
          create: [
            {
              productId: product.id,
              productName: sameProduct ? old.productName : product.name,
              quantity: input.quantity,
              unitPrice,
              unitCost,
            },
          ],
        },
      },
    });
  });
  return { ok: true as const };
}

/** Manual status change from the order page. Sets the matching timestamp. */
export async function setOrderStatus(id: string, status: OrderStatus) {
  const now = new Date();
  const data: Prisma.OrderUpdateInput = { status };
  if (status === "CONFIRMED") data.confirmedAt = now;
  if (status === "CANCELLED") data.cancelledAt = now;
  if (status === "SHIPPED") data.shippedAt = now;
  if (status === "DELIVERED") data.deliveredAt = now;
  if (status === "RETURNED") data.returnedAt = now;
  if (status !== "CALLBACK") data.callbackAt = null;
  await db.order.update({ where: { id }, data });
}
