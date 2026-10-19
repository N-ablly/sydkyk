import { PERSONAS } from "@/lib/demo/personas";
import type { PersonaId } from "@/lib/demo/types";

const SENSITIVE = /\b(salar(y|ies)|pay|paid|payslip|payroll|compensation|wage|bonus|leave balance|balances?|coe|certificate|case|nte|notice to explain|disciplin\w*|medical|record|address|performance|rating)\b/i;

/**
 * Deny-before-lookup (AC09, benchmark deny cases): a question about another person's pay, records or
 * cases is refused without retrieving anything or calling the model, so the reply can't reveal whether
 * such a record exists.
 */
export function asksAboutOthers(message: string, self: PersonaId): boolean {
  if (!SENSITIVE.test(message)) return false;
  const text = message.toLowerCase();
  return Object.values(PERSONAS).some((p) => {
    if (p.id === self) return false;
    const [first, last] = p.name.toLowerCase().split(" ");
    return text.includes(p.name.toLowerCase()) || new RegExp(`\\b${first}('s)?\\b`).test(text) || (last && new RegExp(`\\b${first}\\s+${last}\\b`).test(text));
  });
}

/** Prompt-injection and role-claim phrases are answered by policy, not by changing access. */
export const claimsElevatedRole = (message: string) =>
  /\b(i am|i'm|acting as|as an?)\s+(hr|admin|administrator|manager|payroll|security|employee relations|er reviewer)\b/i.test(message) ||
  /\bignore (all|previous|the above)\b/i.test(message);

export const MAX_QUESTION_CHARS = 500;
