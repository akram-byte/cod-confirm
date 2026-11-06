"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.coerce.number().int().min(0).max(100_000_000),
});

/** One ad spend amount per day: saving a day again replaces it. 0 removes it. */
export async function saveAdSpend(date: string, amount: string | number) {
  await requireOwner();
  const parsed = schema.safeParse({ date, amount });
  if (!parsed.success) return { ok: false as const };
  const day = new Date(`${parsed.data.date}T00:00:00Z`);
  if (isNaN(day.getTime())) return { ok: false as const };
  try {
    if (parsed.data.amount === 0) await db.adSpend.deleteMany({ where: { date: day } });
    else
      await db.adSpend.upsert({
        where: { date: day },
        update: { amount: parsed.data.amount },
        create: { date: day, amount: parsed.data.amount },
      });
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error("save ad spend failed", e);
    return { ok: false as const };
  }
}
