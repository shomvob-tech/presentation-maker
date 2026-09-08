/**
 * Sign-in for the usage-log dashboard.
 *
 * SERVER ONLY — the password literal lives in this module. Never import it
 * from a "use client" file, or it ends up in the browser bundle. (`server-only`
 * isn't installed in this project, so this comment is the guard, same as in
 * sheets.ts.)
 *
 * One shared account, deliberately: the dashboard shows aggregate usage of an
 * internal tool, and the log it reads has no identity in it anyway (see limit 1
 * in notes-plans/audit-log.md). There is nothing per-user to gate.
 *
 * The session cookie is an HMAC over "user.expiry", so it can't be edited by
 * hand in devtools. With no secret configured it falls back to a constant,
 * which means anyone holding this source could mint a cookie — but they would
 * also be holding the password, so the fallback is no weaker than the design
 * already is. Set DASHBOARD_SESSION_SECRET to close that gap.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const USERNAME = "admin";
const PASSWORD = "Whatis?";

export const SESSION_COOKIE = "audit_dashboard";

/** Long enough for a working day, short enough that a shared laptop expires. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function sessionSecret(): string {
  return (
    process.env.DASHBOARD_SESSION_SECRET?.trim() || "audit-dashboard-fallback"
  );
}

/**
 * timingSafeEqual throws on length mismatch, which would itself leak the
 * length. Hashing first makes both sides 32 bytes whatever went in.
 */
function constantTimeEquals(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

export function verifyCredentials(username: string, password: string): boolean {
  // Both comparisons always run: `&&` would short-circuit and make a wrong
  // username measurably faster than a wrong password.
  const usernameMatches = constantTimeEquals(username, USERNAME);
  const passwordMatches = constantTimeEquals(password, PASSWORD);
  return usernameMatches && passwordMatches;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export async function createSession(username: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = username + "." + expiresAt;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, payload + "." + sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    // Plain http on localhost would drop a Secure cookie and make dev look
    // like a broken login.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Safe to call on any request. */
export async function readSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [username, expiresAt, signature] = parts;
  if (!constantTimeEquals(signature, sign(username + "." + expiresAt))) {
    return null;
  }

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  return { username };
}
