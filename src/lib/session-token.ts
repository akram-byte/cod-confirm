// Signs and verifies the session token (JWT, HS256): the owner, or the optional caller login.
// No "server-only" import: it is also used by src/proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cod_session";
export const SESSION_DAYS = 30;

export type Role = "owner" | "caller";

export type SessionPayload = {
  // Short fingerprint of the current password hash: changing the
  // password makes every older session invalid.
  pv: string;
  role: Role;
};

/** Pages the caller login may open: calling customers, nothing about money or settings. */
export const CALLER_PATHS = ["/confirmation", "/rescue", "/orders/new"];

export function callerMayOpen(pathname: string) {
  return CALLER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (min 32 characters). See .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ pv: payload.pv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.role)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if ((payload.sub !== "owner" && payload.sub !== "caller") || typeof payload.pv !== "string") return null;
    return { pv: payload.pv, role: payload.sub };
  } catch {
    return null;
  }
}
