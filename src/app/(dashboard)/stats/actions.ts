"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.coerce.number().int().min(0).max(100_000_000),
  productId: z.string().max(40),
});

/**
 * One ad spend amount per day, either general (productId "") or for one product's campaign.
 * Saving the same day (and product) again replaces it. 0 removes it.
 */
export async function saveAdSpend(date: string, amount: string | number, productId = "") {
  await requireOwner();
  const parsed = schema.safeParse({ date, amount, productId });
  if (!parsed.success) return { ok: false as const };
  const day = new Date(`${parsed.data.date}T00:00:00Z`);
  if (isNaN(day.getTime())) return { ok: false as const };
  const { amount: value, productId: pid } = parsed.data;
  try {
    if (!pid) {
      if (value === 0) await db.adSpend.deleteMany({ where: { date: day } });
      else await db.adSpend.upsert({ where: { date: day }, update: { amount: value }, create: { date: day, amount: value } });
    } else {
      if (!(await db.product.findUnique({ where: { id: pid }, select: { id: true } }))) return { ok: false as const };
      if (value === 0) await db.productAdSpend.deleteMany({ where: { date: day, productId: pid } });
      else
        await db.productAdSpend.upsert({
          where: { date_productId: { date: day, productId: pid } },
          update: { amount: value },
          create: { date: day, productId: pid, amount: value },
        });
    }
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error("save ad spend failed", e);
    return { ok: false as const };
  }
}

const deskOnlySchema = z.object({ wilayaCode: z.number().int().min(1).max(99), deskOnly: z.boolean() });

/** Stop desk only for one wilaya: the order form hides home delivery there. */
export async function setDeskOnly(wilayaCode: number, deskOnly: boolean) {
  await requireOwner();
  const parsed = deskOnlySchema.safeParse({ wilayaCode, deskOnly });
  if (!parsed.success) return { ok: false as const };
  try {
    const res = await db.deliveryFee.updateMany({
      where: { wilayaCode: parsed.data.wilayaCode },
      data: { deskOnly: parsed.data.deskOnly },
    });
    if (res.count === 0) return { ok: false as const };
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error("set desk only failed", e);
    return { ok: false as const };
  }
}
