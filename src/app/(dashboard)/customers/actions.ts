"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export async function setBlacklist(customerId: string, blacklisted: boolean, reason: string) {
  await requireOwner();
  const parsed = z.string().trim().max(200).safeParse(reason);
  if (!parsed.success) return { ok: false };
  try {
    await db.customer.update({
      where: { id: customerId },
      data: { blacklisted, blacklistReason: blacklisted ? parsed.data || null : null },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("blacklist failed", e);
    return { ok: false };
  }
}

export async function saveCustomerNote(customerId: string, note: string) {
  await requireOwner();
  const parsed = z.string().trim().max(1000).safeParse(note);
  if (!parsed.success) return { ok: false };
  try {
    await db.customer.update({ where: { id: customerId }, data: { note: parsed.data || null } });
    revalidatePath(`/customers/${customerId}`);
    return { ok: true };
  } catch (e) {
    console.error("save customer note failed", e);
    return { ok: false };
  }
}
