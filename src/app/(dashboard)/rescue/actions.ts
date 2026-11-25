"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner, requireStaff } from "@/lib/auth";
import { markFailed, recordRescue } from "@/lib/rescue";

const schema = z.object({
  orderId: z.string().min(1),
  result: z.enum(["WILL_RECEIVE", "NO_ANSWER", "REFUSED"]),
  note: z.string().trim().max(500),
});

export async function saveRescue(input: z.input<typeof schema>) {
  await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  try {
    const ok = await recordRescue(parsed.data.orderId, parsed.data.result, parsed.data.note || null);
    revalidatePath("/", "layout");
    return { ok };
  } catch (e) {
    console.error("save rescue failed", e);
    return { ok: false as const };
  }
}

export async function markFailedAttempt(ids: string[]) {
  await requireOwner();
  const parsed = z.array(z.string().min(1)).min(1).max(1000).safeParse(ids);
  if (!parsed.success) return { ok: false as const, count: 0 };
  try {
    const count = await markFailed(parsed.data);
    revalidatePath("/", "layout");
    return { ok: true as const, count };
  } catch (e) {
    console.error("mark failed attempt failed", e);
    return { ok: false as const, count: 0 };
  }
}
