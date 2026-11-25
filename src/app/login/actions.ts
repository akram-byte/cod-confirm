"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession, type Role } from "@/lib/auth";
import { clearLimit, clientIp, isLimited, record } from "@/lib/rate-limit";

export type LoginState = { error?: "required" | "invalid" | "tooMany" | "notSetUp" | "unknown" };

// 5 wrong passwords per IP per 10 minutes. Kept in the database, so it also holds on Vercel.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const schema = z.object({ password: z.string().min(1).max(200) });

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: "required" };

  const key = `login:${await clientIp()}`;
  if (await isLimited(key, MAX_ATTEMPTS)) return { error: "tooMany" };

  let role: Role | null = null;
  try {
    const settings = await db.settings.findUnique({ where: { id: 1 }, select: { passwordHash: true, callerPasswordHash: true } });
    if (!settings) return { error: "notSetUp" };
    // One password field for both logins: the owner's password, or the caller's when one is set.
    if (await bcrypt.compare(parsed.data.password, settings.passwordHash)) role = "owner";
    else if (settings.callerPasswordHash && (await bcrypt.compare(parsed.data.password, settings.callerPasswordHash))) role = "caller";
    if (role) {
      await clearLimit(key);
      await createSession(role === "owner" ? settings.passwordHash : settings.callerPasswordHash, role);
    }
  } catch (e) {
    console.error("login failed", e);
    return { error: "unknown" };
  }

  if (!role) {
    await record(key, WINDOW_MS);
    return { error: "invalid" };
  }
  redirect(role === "owner" ? "/" : "/confirmation");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
