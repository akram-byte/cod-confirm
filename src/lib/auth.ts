import "server-only";
import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "@/lib/session-token";

export function passwordFingerprint(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

export async function createSession(passwordHash: string) {
  const token = await signSession({ pv: passwordFingerprint(passwordHash) });
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

/** True when the request carries a valid owner session. Checked against the DB once per request. */
export const isOwner = cache(async (): Promise<boolean> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return false;
  const settings = await db.settings.findUnique({ where: { id: 1 }, select: { passwordHash: true } });
  return !!settings && passwordFingerprint(settings.passwordHash) === session.pv;
});

/** Call at the top of every protected page, layout and server action. */
export async function requireOwner() {
  if (!(await isOwner())) redirect("/login");
}
