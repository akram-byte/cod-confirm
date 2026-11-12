"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanFbPixel, cleanTiktokPixel } from "@/lib/pixels";

/** Empty clears a pixel. Returns which field is invalid, if any. */
export async function savePixels(fb: string, tiktok: string) {
  await requireOwner();
  const fbId = fb.trim() ? cleanFbPixel(String(fb)) : "";
  const ttId = tiktok.trim() ? cleanTiktokPixel(String(tiktok)) : "";
  if (fbId === null) return { ok: false as const, field: "fb" as const };
  if (ttId === null) return { ok: false as const, field: "tiktok" as const };
  try {
    await db.settings.update({ where: { id: 1 }, data: { fbPixelId: fbId, tiktokPixelId: ttId } });
    revalidatePath("/settings");
    revalidatePath("/order/[slug]", "page");
    return { ok: true as const, fb: fbId, tiktok: ttId };
  } catch (e) {
    console.error("save pixels failed", e);
    return { ok: false as const, field: null };
  }
}
