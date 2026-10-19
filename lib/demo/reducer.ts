import { CHANNELS } from "./channels";
import { formatClock } from "./format";
import { PERSONAS } from "./personas";
import type { AskResult } from "@/lib/rag/types";
import { SCENARIOS } from "./scenarios";
import type {
  AuditEntry,
  ChannelId,
  ChatMessage,
  DemoState,
  ScenarioId,
  ScenarioState,
  Stage,
  StepKey,
} from "./types";

export type DemoAction =
  | { type: "select"; id: ScenarioId }
  | { type: "channel"; channel: ChannelId }
  | { type: "send" }
  | { type: "reply" }
  | { type: "confirm" }
  | { type: "approve" }
  | { type: "reject"; reason: string }
  | { type: "execStep" }
  | { type: "finish" }
  | { type: "branchAsk"; index: number }
  | { type: "branchReply"; index: number }
  | { type: "freeAsk"; scenario: ScenarioId; text: string }
  | { type: "freeReply"; scenario: ScenarioId; result: AskResult }
  | { type: "reset" };

/** The demo clock is frozen at Thu Oct 15, 2026 09:00 Manila time and only moves with simulated activity. */
export const START_CLOCK = 9 * 3600;

export function freshScenario(): ScenarioState {
  return {
    stage: "idle",
    chat: [],
    audit: [],
    approvalIdx: 0,
    decisions: [],
    execDone: 0,
    rejected: false,
    typing: false,
    branchesUsed: [],
    clock: START_CLOCK,
    seq: 0,
  };
}

export function initialDemoState(): DemoState {
  const scenarios = Object.fromEntries(Object.keys(SCENARIOS).map((id) => [id, freshScenario()])) as DemoState["scenarios"];
  return { current: "S01", channel: "mobile", scenarios };
}

/** Steps already complete at each stage; the first step not in the set is the active one. */
const DONE_AT: Record<Stage, StepKey[]> = {
  idle: [],
  thinking: [],
  review: ["request", "policy", "answer", "draft"],
  approval: ["request", "policy", "answer", "draft"],
  executing: ["request", "policy", "answer", "draft", "approval"],
  done: ["request", "policy", "answer", "draft", "approval", "execute", "handoff", "notify"],
};

export function stepStatus(state: ScenarioState, step: StepKey, steps: StepKey[]): "done" | "active" | "bad" | "" {
  if (state.stage === "idle") return "";
  const done = new Set(DONE_AT[state.stage]);
  if (state.rejected) {
    if (step === "approval") return "bad";
    return done.has(step) && step !== "execute" && step !== "notify" ? "done" : "";
  }
  if (done.has(step)) return "done";
  const firstOpen = steps.find((s) => !done.has(s));
  return step === firstOpen ? "active" : "";
}

function draft(prev: ScenarioState) {
  const s: ScenarioState = {
    ...prev,
    chat: [...prev.chat],
    audit: [...prev.audit],
    decisions: [...prev.decisions],
    branchesUsed: [...prev.branchesUsed],
  };
  return {
    s,
    tick(sec: number) {
      s.clock += sec;
    },
    audit(actor: string, event: string, tone?: AuditEntry["tone"]) {
      s.audit.push({ id: ++s.seq, time: formatClock(s.clock, "full"), actor, event, tone });
    },
    say(msg: Omit<ChatMessage, "id" | "time">) {
      s.chat.push({ ...msg, id: ++s.seq, time: formatClock(s.clock) });
    },
  };
}

export const notifiedText = (channel: ChannelId) =>
  channel === "mobile" ? "Requester notified (push + in-app, simulated)" : `Requester notified in ${CHANNELS[channel].name} (simulated)`;

function step(prev: ScenarioState, id: ScenarioId, channel: ChannelId, action: DemoAction): ScenarioState {
  const sc = SCENARIOS[id];
  const requester = PERSONAS[sc.requester];
  const d = draft(prev);
  const { s } = d;

  const finish = () => {
    s.execDone = sc.exec.length;
    if (sc.handoff) {
      d.tick(1);
      d.audit("Sydkyk", `Handoff created · ${sc.handoff.caseId} → ${sc.handoff.queue}`, "warn");
    }
    if (sc.artifact) d.say({ from: "bot", kind: "artifact", text: "" });
    d.tick(1);
    d.say({ from: "bot", kind: "text", text: sc.done });
    d.audit("Sydkyk", notifiedText(channel), "ok");
    s.stage = "done";
  };

  switch (action.type) {
    case "send":
      if (s.stage !== "idle") return prev;
      d.tick(5);
      d.say({ from: "employee", kind: "text", text: sc.prompt });
      d.audit(requester.name, `Asked via ${CHANNELS[channel].label}`);
      s.stage = "thinking";
      return s;

    case "reply":
      if (s.stage !== "thinking") return prev;
      d.tick(3);
      d.audit("Sydkyk", `Permission check passed · ${requester.scope.toLowerCase()}`);
      d.tick(1);
      d.audit("Sydkyk", `Read ${sc.card.record.split(" · ")[0]} (read-only)`);
      d.tick(1);
      d.audit("Sydkyk", `Policy retrieved · ${sc.sources.map((x) => x.replace(/-v1\.1-s\d+$/, "")).filter((v, i, a) => a.indexOf(v) === i).join(", ")} v1.1`);
      d.say({ from: "bot", kind: "text", text: sc.reply, sources: sc.sources });
      d.say({ from: "bot", kind: "card", text: "" });
      s.stage = "review";
      return s;

    case "confirm": {
      if (s.stage !== "review") return prev;
      d.tick(30);
      d.audit(requester.name, `Confirmed: ${sc.card.title}`);
      for (const c of sc.checks) {
        d.tick(1);
        d.audit("Sydkyk", `Policy check · ${c.label}: ${c.detail}`, c.tone === "ok" ? "ok" : c.tone === "bad" ? "bad" : "warn");
      }
      if (sc.approvals.length) {
        const first = PERSONAS[sc.approvals[0].by];
        d.tick(1);
        d.audit("Sydkyk", `Approval requested · ${first.name} (${sc.approvals[0].role}) · payload v1`);
        if (sc.submitted) d.say({ from: "bot", kind: "text", text: sc.submitted });
        s.stage = "approval";
        s.approvalIdx = 0;
      } else if (sc.exec.length) {
        s.stage = "executing";
        s.execDone = 0;
      } else {
        finish();
      }
      return s;
    }

    case "approve": {
      if (s.stage !== "approval") return prev;
      const a = sc.approvals[s.approvalIdx];
      const who = PERSONAS[a.by];
      d.tick(90);
      s.decisions.push({ by: a.by, decision: "approved", time: formatClock(s.clock) });
      d.audit(who.name, `Approved as ${a.role} · payload v1`, "ok");
      if (s.approvalIdx < sc.approvals.length - 1) {
        s.approvalIdx += 1;
        const next = sc.approvals[s.approvalIdx];
        d.tick(1);
        d.audit("Sydkyk", `Approval requested · ${PERSONAS[next.by].name} (${next.role}) · payload v1`);
        d.say({
          from: "bot",
          kind: "text",
          text: `${who.name.split(" ")[0]} approved. Waiting for ${PERSONAS[next.by].name.split(" ")[0]} (${next.role.toLowerCase()}).`,
        });
      } else {
        s.stage = "executing";
        s.execDone = 0;
      }
      return s;
    }

    case "reject": {
      if (s.stage !== "approval") return prev;
      const a = sc.approvals[s.approvalIdx];
      const who = PERSONAS[a.by];
      d.tick(80);
      s.decisions.push({ by: a.by, decision: "rejected", reason: action.reason, time: formatClock(s.clock) });
      s.rejected = true;
      s.stage = "done";
      d.audit(who.name, `Rejected as ${a.role} · ${action.reason}`, "bad");
      d.tick(1);
      d.audit("Sydkyk", `${notifiedText(channel)}. Reservation released; no system changed.`);
      d.say({
        from: "bot",
        kind: "text",
        text: `${who.name.split(" ")[0]} rejected this request: “${action.reason.replace(/[.!?]+$/, "")}.” Nothing was changed, and anything reserved has been released.`,
      });
      return s;
    }

    case "execStep": {
      if (s.stage !== "executing" || s.execDone >= sc.exec.length) return prev;
      const e = sc.exec[s.execDone];
      d.tick(2);
      d.audit("Sydkyk", `${e.system} (mock) · ${e.title} · ${e.detail}`, "ok");
      s.execDone += 1;
      return s;
    }

    case "finish":
      if (s.stage !== "executing") return prev;
      finish();
      return s;

    case "branchAsk": {
      const b = sc.branches[action.index];
      if (!b || s.typing || s.stage === "idle" || s.stage === "thinking") return prev;
      if (b.afterDone && s.stage !== "done") return prev;
      d.tick(20);
      d.say({ from: "employee", kind: "text", text: b.prompt, as: b.as });
      d.audit(PERSONAS[b.as ?? sc.requester].name, `Asked: “${b.prompt}”`);
      s.typing = true;
      return s;
    }

    case "branchReply": {
      const b = sc.branches[action.index];
      if (!b || !s.typing) return prev;
      d.tick(3);
      d.say({ from: "bot", kind: "text", text: b.reply, sources: b.sources, tone: b.tone });
      d.audit("Sydkyk", b.event, b.tone === "deny" ? "bad" : b.tone === "hold" ? "warn" : undefined);
      s.typing = false;
      if (!s.branchesUsed.includes(action.index)) s.branchesUsed.push(action.index);
      return s;
    }

    default:
      return prev;
  }
}

/** Leaving mid-animation: a half-typed answer restarts and an in-flight execution completes. */
function settle(prev: ScenarioState, id: ScenarioId, channel: ChannelId): ScenarioState {
  let s = prev;
  if (s.typing) s = { ...s, typing: false, chat: s.chat.slice(0, -1) };
  if (s.stage === "thinking") return freshScenario();
  if (s.stage === "executing") return step(s, id, channel, { type: "finish" });
  return s;
}

const TONE: Record<AskResult["outcome"], ChatMessage["tone"]> = {
  answer: undefined,
  clarify: "info",
  handoff: "hold",
  unavailable: "hold",
  denied: "deny",
};

/** Free-text questions (Phase 2). They never change the scripted request; they only add chat and audit. */
function freeText(prev: ScenarioState, id: ScenarioId, channel: ChannelId, action: DemoAction): ScenarioState {
  const d = draft(prev);
  const { s } = d;
  const who = PERSONAS[SCENARIOS[id].requester].name;
  if (action.type === "freeAsk") {
    if (s.typing || s.stage === "thinking") return prev;
    d.tick(15);
    d.say({ from: "employee", kind: "text", text: action.text });
    d.audit(who, `Asked via ${CHANNELS[channel].label} (free text)`);
    s.typing = true;
    return s;
  }
  if (action.type === "freeReply") {
    if (!s.typing) return prev;
    const r = action.result;
    d.tick(4);
    d.say({ from: "bot", kind: "text", text: r.answer, refs: r.sources, by: r.by, tone: TONE[r.outcome] });
    const cited = Array.from(new Set(r.sources.map((x) => x.documentId))).join(", ");
    const event =
      r.by === "guard" && r.outcome === "denied"
        ? "Denied before lookup (another person's data)"
        : `${r.by === "model" ? "Answered by Claude" : "Answered by rule"} · ${r.outcome}${cited ? ` · cited ${cited}` : " · no source cited"}`;
    d.audit("Sydkyk", event, r.outcome === "denied" ? "bad" : r.outcome === "answer" ? "ok" : "warn");
    s.typing = false;
    return s;
  }
  return prev;
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  const { current, channel } = state;
  switch (action.type) {
    case "freeAsk":
    case "freeReply": {
      const next = freeText(state.scenarios[action.scenario], action.scenario, channel, action);
      if (next === state.scenarios[action.scenario]) return state;
      return { ...state, scenarios: { ...state.scenarios, [action.scenario]: next } };
    }
    case "select":
      if (action.id === current) return state;
      return {
        ...state,
        current: action.id,
        scenarios: { ...state.scenarios, [current]: settle(state.scenarios[current], current, channel) },
      };
    case "channel":
      return { ...state, channel: action.channel };
    case "reset":
      return { ...state, scenarios: { ...state.scenarios, [current]: freshScenario() } };
    default: {
      const next = step(state.scenarios[current], current, channel, action);
      if (next === state.scenarios[current]) return state;
      return { ...state, scenarios: { ...state.scenarios, [current]: next } };
    }
  }
}
