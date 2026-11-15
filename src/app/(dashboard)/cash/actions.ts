"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { deletePayout, recordPayout } from "@/lib/cash";
import { TZ_OFFSET } from "@/lib/format";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(1000),
  amount: z.number().int().min(0).max(1_000_000_000),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(300),
});

export async function savePayout(input: z.input<typeof schema>) {
  await requireOwner();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const { ids, amount, receivedAt, note } = parsed.data;
  const day = new Date(`${receivedAt}T12:00:00${TZ_OFFSET}`);
  if (isNaN(day.getTime()) || day.getTime() > Date.now() + 86_400_000) return { ok: false as const };
  try {
    const r = await recordPayout(ids, amount, day, note || null);
    if (!r) return { ok: false as const };
    revalidatePath("/cash");
    return { ok: true as const, ...r };
  } catch (e) {
    console.error("save payout failed", e);
    return { ok: false as const };
  }
}

export async function removePayout(id: string) {
  await requireOwner();
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { ok: false };
  try {
    const ok = await deletePayout(parsed.data);
    revalidatePath("/cash");
    return { ok };
  } catch (e) {
    console.error("delete payout failed", e);
    return { ok: false };
  }
}
