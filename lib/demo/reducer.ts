import { CHANNELS } from "./channels";
import { formatClock } from "./format";
import { SCENARIOS } from "./scenarios";
import type {
  AuditEntry,
  ChannelId,
  ChatMessage,
  DemoState,
  RequestValues,
  ScenarioId,
  ScenarioState,
} from "./types";

export type DemoAction =
  | { type: "select"; id: ScenarioId }
  | { type: "channel"; channel: ChannelId }
  | { type: "send" }
  | { type: "reply" }
  | { type: "submit"; values: RequestValues }
  | { type: "approve" }
  | { type: "execStep" }
  | { type: "finish" }
  | { type: "decline"; reason: string }
  | { type: "reset" };

export function freshScenario(id: ScenarioId): ScenarioState {
  return {
    stage: "idle",
    chat: [],
    audit: [],
    values: null,
    rejected: false,
    reason: "",
    execDone: 0,
    clock: SCENARIOS[id].startClock,
    seq: 0,
  };
}

export function initialDemoState(): DemoState {
  return {
    current: "leave",
    channel: "teams",
    scenarios: {
      leave: freshScenario("leave"),
      expense: freshScenario("expense"),
      access: freshScenario("access"),
    },
  };
}

/** A mutable copy of one scenario's state with helpers for the simulated clock, chat and audit log. */
function draft(prev: ScenarioState) {
  const s: ScenarioState = { ...prev, chat: [...prev.chat], audit: [...prev.audit] };
  return {
    s,
    tick(sec: number) {
      s.clock += sec;
    },
    audit(actor: string, event: string, tone?: AuditEntry["tone"]) {
      s.audit.push({ id: ++s.seq, time: formatClock(s.clock, "full"), actor, event, tone });
    },
    say(from: ChatMessage["from"], text: string, kind: ChatMessage["kind"] = "text") {
      s.chat.push({ id: ++s.seq, from, kind, text, time: formatClock(s.clock) });
    },
  };
}

export const notifiedText = (channel: ChannelId) =>
  channel === "mobile" ? "Employee notified (push + in-app)" : `Employee notified in ${CHANNELS[channel].name}`;

function finish(d: ReturnType<typeof draft>, id: ScenarioId, channel: ChannelId) {
  const sc = SCENARIOS[id];
  d.tick(1);
  d.audit("Sydkyk", notifiedText(channel), "ok");
  d.say("bot", sc.done(d.s.values!));
  d.s.stage = "done";
}

function step(prev: ScenarioState, id: ScenarioId, channel: ChannelId, action: DemoAction): ScenarioState {
  const sc = SCENARIOS[id];
  const d = draft(prev);
  const { s } = d;

  switch (action.type) {
    case "send":
      if (s.stage !== "idle") return prev;
      d.tick(5);
      d.say("employee", sc.prompt);
      d.audit(sc.employee.name, "Request received via " + CHANNELS[channel].label);
      s.stage = "thinking";
      return s;

    case "reply":
      if (s.stage !== "thinking") return prev;
      d.tick(3);
      d.audit("Sydkyk", "Intent: " + sc.intent);
      d.tick(1);
      d.audit("Sydkyk", sc.readEvent);
      d.say("bot", sc.reply);
      d.say("bot", "", "card");
      s.stage = "review";
      return s;

    case "submit": {
      if (s.stage !== "review") return prev;
      const v = action.values;
      s.values = v;
      d.tick(40);
      d.audit(sc.employee.name, "Submitted: " + sc.title(v));
      for (const [check] of sc.checks(v)) {
        d.tick(1);
        d.audit("Sydkyk", "Policy check passed · " + check, "ok");
      }
      d.tick(1);
      d.audit("Sydkyk", "Approval requested from " + sc.approver.name);
      if (channel === "mobile") {
        d.tick(1);
        d.audit("Sydkyk", `Push notification sent to ${sc.approver.name}’s phone`);
      }
      d.say(
        "bot",
        `Sent to ${sc.approver.name.split(" ")[0]} for approval. Nothing changes in ${sc.systemOfRecord} until it’s approved. I’ll message you here when it’s done.`,
      );
      s.stage = "pending";
      return s;
    }

    case "approve":
      if (s.stage !== "pending") return prev;
      d.tick(95);
      d.audit(sc.approver.name, "Approved", "ok");
      s.stage = "executing";
      s.execDone = 0;
      return s;

    case "execStep": {
      if (s.stage !== "executing" || !s.values) return prev;
      const steps = sc.exec(s.values);
      if (s.execDone >= steps.length) return prev;
      const [title, detail] = steps[s.execDone];
      d.tick(2);
      d.audit("Sydkyk", `${title} · ${detail}`, "ok");
      s.execDone += 1;
      return s;
    }

    case "finish":
      if (s.stage !== "executing" || !s.values) return prev;
      s.execDone = sc.exec(s.values).length;
      finish(d, id, channel);
      return s;

    case "decline":
      if (s.stage !== "pending") return prev;
      d.tick(80);
      s.rejected = true;
      s.reason = action.reason;
      s.stage = "done";
      d.audit(sc.approver.name, "Declined · " + action.reason, "bad");
      d.tick(1);
      d.audit("Sydkyk", notifiedText(channel) + ". No system changes made.");
      d.say(
        "bot",
        `${sc.approver.name.split(" ")[0]} declined this request: “${action.reason}”. Nothing was changed. Reply here if you want to adjust it and resend.`,
      );
      return s;

    default:
      return prev;
  }
}

/**
 * Leaving a scenario mid-animation would strand it: a half-typed reply restarts,
 * and an in-flight execution completes instantly.
 */
function settle(prev: ScenarioState, id: ScenarioId, channel: ChannelId): ScenarioState {
  if (prev.stage === "thinking") return freshScenario(id);
  if (prev.stage === "executing") return step(prev, id, channel, { type: "finish" });
  return prev;
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  const { current, channel } = state;
  switch (action.type) {
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
      return { ...state, scenarios: { ...state.scenarios, [current]: freshScenario(current) } };
    default: {
      const next = step(state.scenarios[current], current, channel, action);
      if (next === state.scenarios[current]) return state;
      return { ...state, scenarios: { ...state.scenarios, [current]: next } };
    }
  }
}
