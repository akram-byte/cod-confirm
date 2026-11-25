"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { markDraft } from "@/lib/drafts";

const schema = z.object({ id: z.string().min(1), result: z.enum(["NO_ANSWER", "DISMISSED"]) });

export async function saveDraftResult(input: z.input<typeof schema>) {
  await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    const ok = await markDraft(parsed.data.id, parsed.data.result);
    revalidatePath("/confirmation", "layout");
    return { ok };
  } catch (e) {
    console.error("save draft result failed", e);
    return { ok: false };
  }
}
