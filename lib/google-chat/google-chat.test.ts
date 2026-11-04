import { generateKeyPairSync, sign, type JsonWebKey } from "node:crypto";
import { describe, expect, it } from "vitest";
import { formatAnswer, parseEvent, reply } from "./event";
import { CHAT_ISSUER, verifyChatToken, type KeyFetcher } from "./verify";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...(publicKey.export({ format: "jwk" }) as JsonWebKey), kid: "k1" };
const keys: KeyFetcher = async () => [jwk];
const NOW = 1_800_000_000_000;
const t = NOW / 1000;

function token(claims: Record<string, unknown>, kid = "k1") {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const body = `${enc({ alg: "RS256", kid, typ: "JWT" })}.${enc(claims)}`;
  return `${body}.${sign("RSA-SHA256", Buffer.from(body), privateKey).toString("base64url")}`;
}

describe("verifyChatToken", () => {
  const opts = { audience: "123456789", keys, now: NOW };

  it("accepts a Chat-signed token for the project number", async () => {
    expect(await verifyChatToken(token({ iss: CHAT_ISSUER, aud: "123456789", iat: t, exp: t + 3600 }), opts)).toBe(true);
  });

  it("accepts a Google ID token from the allowed sender for the endpoint URL", async () => {
    const aud = "https://sydkyk.vercel.app/experience/api/google-chat";
    const claims = { iss: "https://accounts.google.com", aud, email: CHAT_ISSUER, email_verified: true, iat: t, exp: t + 3600 };
    expect(await verifyChatToken(token(claims), { ...opts, audience: aud })).toBe(true);
  });

  it("rejects the wrong audience, issuer, sender, expiry, key or signature", async () => {
    const ok = { iss: CHAT_ISSUER, aud: "123456789", iat: t, exp: t + 3600 };
    expect(await verifyChatToken(token({ ...ok, aud: "999" }), opts)).toBe(false);
    expect(await verifyChatToken(token({ ...ok, iss: "attacker@example.com" }), opts)).toBe(false);
    expect(await verifyChatToken(token({ ...ok, iss: "accounts.google.com", email: "someone@gmail.com", email_verified: true }), opts)).toBe(false);
    expect(await verifyChatToken(token({ ...ok, exp: t - 3600 }), opts)).toBe(false);
    expect(await verifyChatToken(token(ok, "unknown"), opts)).toBe(false);
    expect(await verifyChatToken(`${token(ok).slice(0, -4)}AAAA`, opts)).toBe(false);
    expect(await verifyChatToken("not-a-jwt", opts)).toBe(false);
  });
});

describe("parseEvent and reply", () => {
  it("reads a classic Chat message, preferring the text after the @mention", () => {
    const e = parseEvent({ type: "MESSAGE", message: { text: "@Sydkyk how much leave?", argumentText: " how much leave?" }, user: { name: "users/1" } });
    expect(e).toEqual({ kind: "message", text: "how much leave?", user: "users/1", addon: false });
    expect(reply("hi", false)).toEqual({ text: "hi" });
  });

  it("reads a Workspace add-on message and wraps the reply for it", () => {
    const e = parseEvent({ chat: { user: { name: "users/2" }, messagePayload: { message: { text: "VPN setup" } } } });
    expect(e).toEqual({ kind: "message", text: "VPN setup", user: "users/2", addon: true });
    expect(reply("hi", true)).toEqual({ hostAppDataAction: { chatDataAction: { createMessageAction: { message: { text: "hi" } } } } });
  });

  it("recognises being added and ignores everything else", () => {
    expect(parseEvent({ type: "ADDED_TO_SPACE" }).kind).toBe("added");
    expect(parseEvent({ chat: { addedToSpacePayload: {} } }).kind).toBe("added");
    expect(parseEvent({ type: "REMOVED_FROM_SPACE" }).kind).toBe("ignore");
    expect(parseEvent(null).kind).toBe("ignore");
    expect(reply(null, true)).toEqual({});
  });

  it("lists each cited document once under the answer", () => {
    const src = { id: "c1", documentId: "HR-001", title: "Leave Policy", version: "1.1", effectiveFrom: "", owner: "", classification: "", section: "", text: "" };
    const text = formatAnswer({ outcome: "answer", answer: "You get 15 days.", sources: [src, { ...src, id: "c2" }], by: "model" });
    expect(text).toBe("You get 15 days.\n\n*Sources*\n• HR-001 v1.1 · Leave Policy");
  });
});
