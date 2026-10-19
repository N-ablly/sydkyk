import corpus from "./corpus.generated.json";
import type { PersonaId, ScenarioId } from "@/lib/demo/types";

export interface Chunk {
  chunk_id: string;
  document_id: string;
  title: string;
  version: string;
  effective_from: string;
  owner: string;
  classification: string;
  section: string;
  required_grants: string[];
  allowed_roles: string[];
  text: string;
}

const CHUNKS = corpus as Chunk[];

/**
 * Access policy (04_rag/access_policy.json): default deny. Everyone sees internal_all policy.
 * Restricted ER material needs the ER role AND the active case grant, which only Liza holds, and only
 * while working her assigned case in S11. Filtering happens before ranking, so nothing restricted can
 * leak through a score, a title or a citation.
 */
export function permittedChunks(persona: PersonaId, scenario: ScenarioId): Chunk[] {
  const hasErGrant = persona === "E0004" && scenario === "S11";
  return CHUNKS.filter((c) => (c.classification === "restricted_er" ? hasErGrant : c.classification === "internal_all"));
}

const STOP = new Set(
  "a an and are as at be but by can do does for from has have how i if in is it its me my no not of on or our so that the their them then there these this to was we what when where which who why will with you your".split(" "),
);

export const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9₱\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));

/** Workplace abbreviations employees type, expanded to the words the policies use. */
const ABBREVIATIONS: Record<string, string> = {
  coe: "certificate employment",
  nte: "notice explain",
  po: "purchase order",
  gr: "goods receipt",
  mfa: "multi factor authentication",
  ot: "overtime",
  wfh: "work from home remote",
  vl: "vacation leave",
  sl: "sick leave",
  "13th": "13th month pay",
};

export const expandQuery = (query: string) =>
  query + " " + tokenize(query).flatMap((t) => (ABBREVIATIONS[t] ? [ABBREVIATIONS[t]] : [])).join(" ");

/** BM25 over the permitted chunks (section title weighted double). Deterministic; no embeddings needed for 96 chunks. */
export function retrieve(query: string, pool: Chunk[], k = 4): Chunk[] {
  const q = Array.from(new Set(tokenize(expandQuery(query))));
  if (!q.length || !pool.length) return [];
  const docs = pool.map((c) => tokenize(`${c.section} ${c.section} ${c.title} ${c.text}`));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const K1 = 1.2;
  const B = 0.75;
  const scored = docs.map((d, i) => {
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (docs.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / avg));
    }
    return { chunk: pool[i], score };
  });
  return scored
    .filter((s) => s.score > 1.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);
}
