import type { AskResult } from "@/lib/rag/types";

/**
 * Google Chat posts one of two event shapes, depending on how the app is configured:
 * - Classic Chat app: { type: "MESSAGE", message: {...}, user, space }, answered with a Message.
 * - Built as a Google Workspace add-on: { chat: { messagePayload: {...}, user }, ... }, answered with
 *   a hostAppDataAction that wraps the Message.
 */
export type ChatEvent =
  | { kind: "message"; text: string; user: string | null; addon: boolean }
  | { kind: "added"; user: string | null; addon: boolean }
  | { kind: "ignore"; addon: boolean };

interface ChatMessage {
  text?: string;
  argumentText?: string;
}

interface RawEvent {
  type?: string;
  message?: ChatMessage;
  user?: { name?: string };
  chat?: {
    user?: { name?: string };
    messagePayload?: { message?: ChatMessage };
    addedToSpacePayload?: unknown;
  };
}

// argumentText leaves out the @mention that addressed the app in a space; DMs only have text.
const messageText = (m: ChatMessage | undefined) => (m?.argumentText ?? m?.text ?? "").trim();

export function parseEvent(body: unknown): ChatEvent {
  const e = (body ?? {}) as RawEvent;
  if (e.chat) {
    const user = e.chat.user?.name ?? null;
    if (e.chat.messagePayload) return { kind: "message", text: messageText(e.chat.messagePayload.message), user, addon: true };
    if (e.chat.addedToSpacePayload) return { kind: "added", user, addon: true };
    return { kind: "ignore", addon: true };
  }
  const user = e.user?.name ?? null;
  if (e.type === "MESSAGE") return { kind: "message", text: messageText(e.message), user, addon: false };
  if (e.type === "ADDED_TO_SPACE") return { kind: "added", user, addon: false };
  return { kind: "ignore", addon: false };
}

/** Wraps a plain-text reply in the response shape the event's sender expects. */
export function reply(text: string | null, addon: boolean) {
  if (text === null) return {};
  const message = { text };
  return addon ? { hostAppDataAction: { chatDataAction: { createMessageAction: { message } } } } : message;
}

/** Google Chat text formatting: *bold*, _italic_. Sources are listed under the answer. */
export function formatAnswer(result: AskResult) {
  if (!result.sources.length) return result.answer;
  const seen = new Set<string>();
  const lines = result.sources
    .filter((s) => !seen.has(s.documentId) && seen.add(s.documentId))
    .map((s) => `• ${s.documentId} v${s.version} · ${s.title}`);
  return `${result.answer}\n\n*Sources*\n${lines.join("\n")}`;
}
