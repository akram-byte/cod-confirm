"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth";

export type LoginState = { error?: "required" | "invalid" | "tooMany" | "notSetUp" | "unknown" };

// Simple in-memory limit: 5 wrong passwords per IP per 10 minutes.
// Good enough for a single-owner app on one server.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function tooMany(ip: string) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW_MS) return false;
  return a.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else a.count++;
}

const schema = z.object({ password: z.string().min(1).max(200) });

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: "required" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (tooMany(ip)) return { error: "tooMany" };

  let ok = false;
  try {
    const settings = await db.settings.findUnique({ where: { id: 1 }, select: { passwordHash: true } });
    if (!settings) return { error: "notSetUp" };
    ok = await bcrypt.compare(parsed.data.password, settings.passwordHash);
    if (ok) {
      attempts.delete(ip);
      await createSession(settings.passwordHash);
    }
  } catch (e) {
    console.error("login failed", e);
    return { error: "unknown" };
  }

  if (!ok) {
    recordFailure(ip);
    return { error: "invalid" };
  }
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
