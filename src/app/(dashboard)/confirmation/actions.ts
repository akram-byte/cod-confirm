"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { logCall, type LogCallResult } from "@/lib/confirmation";

const schema = z.object({
  orderId: z.string().min(1),
  outcome: z.enum(["CONFIRMED", "NO_ANSWER", "CALLBACK", "CANCELLED"]),
  note: z.string().trim().max(500),
  callbackAt: z.string().nullable(),
});

export async function recordCall(input: z.input<typeof schema>): Promise<LogCallResult | { ok: false; error: "unknown" }> {
  await requireOwner();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "unknown" };
  const { orderId, outcome, note, callbackAt } = parsed.data;
  try {
    const result = await logCall(orderId, outcome, note || null, callbackAt ? new Date(callbackAt) : null);
    if (result.ok) revalidatePath("/", "layout");
    return result;
  } catch (e) {
    console.error("record call failed", e);
    return { ok: false, error: "unknown" };
  }
}
