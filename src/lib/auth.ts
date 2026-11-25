import "server-only";
import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type Role } from "@/lib/session-token";

export type { Role } from "@/lib/session-token";

export function passwordFingerprint(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

export async function createSession(passwordHash: string, role: Role = "owner") {
  const token = await signSession({ pv: passwordFingerprint(passwordHash), role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Who is signed in: the owner, the caller (optional second login that only calls customers), or nobody.
 * Checked against the database once per request: changing or removing a password signs that login out.
 */
export const getRole = cache(async (): Promise<Role | null> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const settings = await db.settings.findUnique({ where: { id: 1 }, select: { passwordHash: true, callerPasswordHash: true } });
  if (!settings) return null;
  if (session.role === "owner") return passwordFingerprint(settings.passwordHash) === session.pv ? "owner" : null;
  return settings.callerPasswordHash && passwordFingerprint(settings.callerPasswordHash) === session.pv ? "caller" : null;
});

export async function isOwner(): Promise<boolean> {
  return (await getRole()) === "owner";
}

/** Owner only. Call at the top of every protected page and server action. The caller is sent to the call queue. */
export async function requireOwner() {
  const role = await getRole();
  if (!role) redirect("/login");
  if (role !== "owner") redirect("/confirmation");
}

/** Owner or caller: for the calling screens (confirmation, abandoned orders, save the parcel). */
export async function requireStaff(): Promise<Role> {
  const role = await getRole();
  if (!role) redirect("/login");
  return role;
}
