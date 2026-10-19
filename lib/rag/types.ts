/** Shared by the /api/ask route and the browser. */
export type Outcome = "answer" | "clarify" | "handoff" | "denied" | "unavailable";

export interface SourceRef {
  id: string;
  documentId: string;
  title: string;
  version: string;
  effectiveFrom: string;
  owner: string;
  classification: string;
  section: string;
  text: string;
}

export interface AskResult {
  outcome: Outcome;
  answer: string;
  sources: SourceRef[];
  /** "model" when Claude wrote the answer; "guard" when a deterministic rule answered without calling it. */
  by: "model" | "guard";
}
