import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { PERSONAS } from "@/lib/demo/personas";
import { isScenarioId, SCENARIOS } from "@/lib/demo/scenarios";
import { formatAnswer, parseEvent, reply } from "@/lib/google-chat/event";
import { verifyChatToken } from "@/lib/google-chat/verify";
import { answerQuestion } from "@/lib/rag/answer";
import { MAX_QUESTION_CHARS } from "@/lib/rag/guard";
import { GLOBAL_ASK_BUCKET, withinLimits } from "@/lib/rate-limit";

/**
 * Google Chat app endpoint. Chat waits about 30 seconds for a synchronous reply, so answers are
 * returned in the response rather than posted later through the Chat API.
 */
export const maxDuration = 60;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  // Fail closed: without an audience there is no way to tell Google's requests from anyone else's.
  const audience = process.env.GOOGLE_CHAT_AUDIENCE;
  if (!audience) return json({ error: "Google Chat isn’t configured for this deployment." }, 503);

  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token || !(await verifyChatToken(token, { audience, sender: process.env.GOOGLE_CHAT_SERVICE_ACCOUNT || undefined }))) {
    return json({ error: "Unauthorized." }, 401);
  }

  const event = parseEvent(await request.json().catch(() => null));
  const scenarioEnv = process.env.GOOGLE_CHAT_SCENARIO;
  const scenario = isScenarioId(scenarioEnv) ? scenarioEnv : "S01";

  if (event.kind === "ignore") return json(reply(null, event.addon));
  if (event.kind === "added") {
    const persona = PERSONAS[SCENARIOS[scenario].requester];
    return json(
      reply(
        `Hi, I’m Sydkyk, the SYDKYK employee-service assistant. Ask me about HR, IT, Finance or Workplace policies. ` +
          `In this demo you’re signed in as ${persona.name} (${persona.role}), and every company, person and record is fictional.`,
        event.addon,
      ),
    );
  }

  if (event.text.length < 2) return json(reply("Ask me a question about a SYDKYK policy, for example “How many vacation days do I get?”", event.addon));
  if (event.text.length > MAX_QUESTION_CHARS) return json(reply(`That’s a long one. Keep questions under ${MAX_QUESTION_CHARS} characters.`, event.addon));

  const userKey = createHash("sha256").update(event.user ?? "unknown").digest("hex").slice(0, 32);
  if (!(await withinLimits([[`ask:gchat:${userKey}`, 600, 20], GLOBAL_ASK_BUCKET]))) {
    return json(reply("You’ve asked a lot of questions in a short time. Wait a few minutes, then try again.", event.addon));
  }

  const result = await answerQuestion(event.text, scenario);
  return json(reply(formatAnswer(result), event.addon));
}
