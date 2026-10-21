import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isScenarioId } from "@/lib/demo/scenarios";
import { REGISTRATION_REQUIRED, supabaseConfigured } from "@/lib/leads/config";
import { clientFingerprint, readSession } from "@/lib/leads/session";
import { answerQuestion } from "@/lib/rag/answer";
import { MAX_QUESTION_CHARS } from "@/lib/rag/guard";
import { adminClient } from "@/lib/supabase/admin";

const Body = z.object({
  question: z.string().trim().min(2).max(MAX_QUESTION_CHARS),
  scenario: z.string().refine(isScenarioId),
});

// Fallback limiter for deployments without Supabase (per server instance only).
const memory = new Map<string, { window: number; hits: number }>();
function memoryLimit(key: string, windowSec: number, max: number) {
  const w = Math.floor(Date.now() / 1000 / windowSec);
  const cur = memory.get(key);
  const hits = cur && cur.window === w ? cur.hits + 1 : 1;
  memory.set(key, { window: w, hits });
  return hits <= max;
}

async function underLimit(request: NextRequest, sessionId: string | null) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const buckets: [string, number, number][] = [
    ...(sessionId ? ([[`ask:s:${sessionId}`, 600, 20]] as [string, number, number][]) : []), // per registered visitor
    // Per network. Without registration a shared touch screen is one network, so this allows a steady queue.
    [`ask:ip:${clientFingerprint(ip)}`, 600, 120],
    ["ask:global", 86_400, 2_000], // daily ceiling across the whole demo, to cap model spend
  ];
  for (const [bucket, window, max] of buckets) {
    if (supabaseConfigured()) {
      const { data, error } = await adminClient().rpc("hit_rate_limit", { p_bucket: bucket, p_window_seconds: window, p_max: max });
      if (!error && data === false) return false;
      if (!error) continue;
    }
    if (!memoryLimit(bucket, window, max)) return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (REGISTRATION_REQUIRED && !session) return NextResponse.json({ error: "Register to use the demo." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: `Ask a question between 2 and ${MAX_QUESTION_CHARS} characters.` }, { status: 400 });
  }
  if (!(await underLimit(request, session ? `${session.lid}:${session.exp}` : null))) {
    return NextResponse.json({ error: "You’ve asked a lot of questions in a short time. Wait a few minutes, then try again." }, { status: 429 });
  }

  const result = await answerQuestion(parsed.data.question, parsed.data.scenario as Parameters<typeof answerQuestion>[1]);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
