import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

/**
 * Checks the bearer token Google Chat sends with every request to an HTTP endpoint.
 * Google sends one of two kinds, depending on the app's "Authentication audience" setting:
 * - Project number: a JWT signed by chat@system.gserviceaccount.com, aud = the project number.
 * - HTTP endpoint URL: a Google ID token for that service account, aud = the endpoint URL.
 * Chat apps built as Google Workspace add-ons send an ID token for the add-on's own service account
 * (service-<project-number>@gcp-sa-gsuiteaddons.iam.gserviceaccount.com), set as `sender`.
 */
export const CHAT_ISSUER = "chat@system.gserviceaccount.com";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const JWKS = {
  chat: `https://www.googleapis.com/service_accounts/v1/jwk/${CHAT_ISSUER}`,
  google: "https://www.googleapis.com/oauth2/v3/certs",
};
const CLOCK_SKEW_SECONDS = 300;

type Jwk = JsonWebKey & { kid?: string };
export type KeyFetcher = (url: string, refresh: boolean) => Promise<Jwk[]>;

const cache = new Map<string, { keys: Jwk[]; until: number }>();
const fetchKeys: KeyFetcher = async (url, refresh) => {
  const hit = cache.get(url);
  if (hit && !refresh && hit.until > Date.now()) return hit.keys;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`google keys ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  cache.set(url, { keys, until: Date.now() + 3600_000 });
  return keys;
};

const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

export interface VerifyOptions {
  /** The project number or endpoint URL configured as the app's authentication audience. */
  audience: string;
  /** Service account allowed to send ID tokens. */
  sender?: string;
  keys?: KeyFetcher;
  now?: number;
}

export async function verifyChatToken(token: string, { audience, sender = CHAT_ISSUER, keys = fetchKeys, now = Date.now() }: VerifyOptions) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return false;
    const header = decode(h) as { alg?: string; kid?: string };
    const claims = decode(p) as { iss?: string; aud?: string | string[]; exp?: number; iat?: number; email?: string; email_verified?: boolean };
    if (header.alg !== "RS256" || !header.kid) return false;

    let url: string;
    if (claims.iss === CHAT_ISSUER) url = JWKS.chat;
    else if (claims.iss && GOOGLE_ISSUERS.has(claims.iss) && claims.email_verified === true && claims.email === sender) url = JWKS.google;
    else return false;

    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const t = Math.floor(now / 1000);
    if (!auds.includes(audience)) return false;
    if (typeof claims.exp !== "number" || claims.exp + CLOCK_SKEW_SECONDS < t) return false;
    if (typeof claims.iat === "number" && claims.iat - CLOCK_SKEW_SECONDS > t) return false;

    // Google rotates keys; refetch once when the token names a key we haven't seen.
    let jwk = (await keys(url, false)).find((k) => k.kid === header.kid);
    jwk ??= (await keys(url, true)).find((k) => k.kid === header.kid);
    if (!jwk) return false;

    return verify("RSA-SHA256", Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(s, "base64url"));
  } catch {
    return false;
  }
}
