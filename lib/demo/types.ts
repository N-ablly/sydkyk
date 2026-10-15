export type ScenarioId = "leave" | "expense" | "access";
export type ChannelId = "teams" | "gchat" | "mobile";

/** Where a scenario is in the request → policy → approval → execute → notify flow. */
export type Stage = "idle" | "thinking" | "review" | "pending" | "executing" | "done";

export interface Person {
  name: string;
  initials: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  from: "employee" | "bot";
  /** "card" renders the scenario's request card (editable during review, summary after). */
  kind: "text" | "card";
  text: string;
  time: string;
}

export interface AuditEntry {
  id: number;
  time: string;
  actor: string;
  event: string;
  tone?: "ok" | "bad";
}

export type LeaveType = "Vacation leave" | "Sick leave" | "Emergency leave";

export interface LeaveValues {
  type: LeaveType;
  from: string;
  to: string;
  note: string;
  days: number;
  balance: number;
}

export interface ExpenseValues {
  client: string;
  attendees: number;
  amount: number;
}

export interface AccessValues {
  permissionSet: string;
  duration: string;
  reason: string;
}

export type RequestValues = LeaveValues | ExpenseValues | AccessValues;

/** A pair rendered as label / value or title / detail. */
export type Pair = [string, string];

export interface Scenario<V extends RequestValues = RequestValues> {
  id: ScenarioId;
  label: string;
  employee: Person;
  approver: Person;
  prompt: string;
  intent: string;
  reply: string;
  readEvent: string;
  /** Systems touched after the chat channel, in order. */
  systems: string[];
  /** The system that must not change before approval. */
  systemOfRecord: string;
  declineDraft: string;
  /** Simulated clock start for this scenario, seconds since midnight. */
  startClock: number;
  title(v: V): string;
  details(v: V): Pair[];
  checks(v: V): Pair[];
  exec(v: V): Pair[];
  done(v: V): string;
}

export interface ScenarioState {
  stage: Stage;
  chat: ChatMessage[];
  audit: AuditEntry[];
  values: RequestValues | null;
  rejected: boolean;
  reason: string;
  execDone: number;
  clock: number;
  seq: number;
}

export interface DemoState {
  current: ScenarioId;
  channel: ChannelId;
  scenarios: Record<ScenarioId, ScenarioState>;
}
