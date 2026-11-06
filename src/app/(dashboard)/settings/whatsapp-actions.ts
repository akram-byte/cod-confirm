"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export async function saveWhatsappTemplate(template: string) {
  await requireOwner();
  const parsed = z.string().trim().max(1000).safeParse(template);
  if (!parsed.success) return { ok: false };
  try {
    await db.settings.update({ where: { id: 1 }, data: { whatsappTemplate: parsed.data } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("save whatsapp template failed", e);
    return { ok: false };
  }
}
