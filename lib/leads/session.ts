import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseSecretKey } from "./config";

export const SESSION_COOKIE = "sydkyk_demo";
const MAX_AGE_SECONDS = 7 * 24 * 3600;

export interface DemoSession {
  /** Lead ID when saved, or "test" in test-registration mode. */
  lid: string;
  mode: "saved" | "test";
  exp: number;
}

/**
 * Signing key: a dedicated DEMO_SESSION_SECRET if set, otherwise derived from the Supabase secret key.
 * Without either (local test mode) a fixed development key is used; that session only unlocks the
 * public demo, which holds no private data.
 */
function key(): Buffer {
  const base = process.env.DEMO_SESSION_SECRET ?? supabaseSecretKey() ?? "sydkyk-local-test-mode";
  return createHash("sha256").update(`sydkyk-demo-session-v1:${base}`).digest();
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("base64url");

export function encodeSession(s: Omit<DemoSession, "exp">): string {
  const payload = b64(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): DemoSession | null {
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as DemoSession;
    return s.exp > Date.now() / 1000 ? s : null;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<DemoSession | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function writeSession(s: Omit<DemoSession, "exp">) {
  (await cookies()).set(SESSION_COOKIE, encodeSession(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Salted, truncated hash of the client address for rate limiting. The raw IP is never stored. */
export function clientFingerprint(ip: string | null): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", key()).update(`${day}:${ip ?? "unknown"}`).digest("hex").slice(0, 32);
}
