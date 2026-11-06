"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSession, requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, hit } from "@/lib/rate-limit";

export async function saveStoreName(name: string) {
  await requireOwner();
  const parsed = z.string().trim().min(1).max(60).safeParse(name);
  if (!parsed.success) return { ok: false };
  try {
    await db.settings.update({ where: { id: 1 }, data: { storeName: parsed.data } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("save store name failed", e);
    return { ok: false };
  }
}

const feeRow = z.object({
  wilayaCode: z.number().int().min(1).max(99),
  homeFee: z.number().int().min(0).max(100_000),
  deskFee: z.number().int().min(0).max(100_000),
  active: z.boolean(),
});

/** Saves only the rows the owner changed. */
export async function saveDeliveryFees(rows: z.input<typeof feeRow>[]) {
  await requireOwner();
  const parsed = z.array(feeRow).min(1).max(100).safeParse(rows);
  if (!parsed.success) return { ok: false };
  try {
    await db.$transaction(
      parsed.data.map((r) =>
        db.deliveryFee.upsert({
          where: { wilayaCode: r.wilayaCode },
          update: { homeFee: r.homeFee, deskFee: r.deskFee, active: r.active },
          create: r,
        }),
      ),
    );
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("save fees failed", e);
    return { ok: false };
  }
}

export type PasswordState = { ok: boolean; error?: "current" | "short" | "mismatch" | "tooMany" | "unknown" };

export async function changePassword(current: string, next: string, confirm: string): Promise<PasswordState> {
  await requireOwner();
  if (next.length < 8 || next.length > 200) return { ok: false, error: "short" };
  if (next !== confirm) return { ok: false, error: "mismatch" };
  if (hit(`password:${await clientIp()}`, 5, 10 * 60 * 1000)) return { ok: false, error: "tooMany" };
  try {
    const settings = await db.settings.findUniqueOrThrow({ where: { id: 1 }, select: { passwordHash: true } });
    if (!(await bcrypt.compare(current, settings.passwordHash))) return { ok: false, error: "current" };
    const passwordHash = await bcrypt.hash(next, 12);
    await db.settings.update({ where: { id: 1 }, data: { passwordHash } });
    // Other devices are signed out (their session points at the old password); keep this one signed in.
    await createSession(passwordHash);
    return { ok: true };
  } catch (e) {
    console.error("change password failed", e);
    return { ok: false, error: "unknown" };
  }
}
