// Signs and verifies the owner session token (JWT, HS256).
// No "server-only" import: it is also used by src/proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cod_session";
export const SESSION_DAYS = 30;

export type SessionPayload = {
  // Short fingerprint of the current password hash: changing the
  // password makes every older session invalid.
  pv: string;
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (min 32 characters). See .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.sub !== "owner" || typeof payload.pv !== "string") return null;
    return { pv: payload.pv };
  } catch {
    return null;
  }
}
