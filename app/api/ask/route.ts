import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isScenarioId } from "@/lib/demo/scenarios";
import { REGISTRATION_REQUIRED } from "@/lib/leads/config";
import { clientFingerprint, readSession } from "@/lib/leads/session";
import { answerQuestion } from "@/lib/rag/answer";
import { MAX_QUESTION_CHARS } from "@/lib/rag/guard";
import { GLOBAL_ASK_BUCKET, withinLimits, type Bucket } from "@/lib/rate-limit";

const Body = z.object({
  question: z.string().trim().min(2).max(MAX_QUESTION_CHARS),
  scenario: z.string().refine(isScenarioId),
});

function underLimit(request: NextRequest, sessionId: string | null) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const buckets: Bucket[] = [
    ...(sessionId ? ([[`ask:s:${sessionId}`, 600, 20]] as Bucket[]) : []), // per registered visitor
    // Per network. Without registration a shared touch screen is one network, so this allows a steady queue.
    [`ask:ip:${clientFingerprint(ip)}`, 600, 120],
    GLOBAL_ASK_BUCKET,
  ];
  return withinLimits(buckets);
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
