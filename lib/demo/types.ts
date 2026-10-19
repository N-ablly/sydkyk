import type { SourceId } from "./sources.generated";

export type ScenarioId = "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08" | "S09" | "S10" | "S11" | "S12";
export type ChannelId = "teams" | "gchat" | "slack" | "mobile";
export type PersonaId = "E0001" | "E0002" | "E0003" | "E0004" | "E0005" | "E0006" | "E0007" | "E0008" | "E0010";
export type Domain = "HR" | "IT" | "Finance" | "Workplace";

/** The four outcome types from the spec. Each scenario shows exactly one. */
export type Mode = "transaction" | "answer" | "draft" | "handoff";

/** Where a scenario is. Answers stop at "review"; writes continue through approval and execution. */
export type Stage = "idle" | "thinking" | "review" | "approval" | "executing" | "done";

/** Progress-bar steps. Each scenario lists only the steps it actually goes through. */
export type StepKey = "request" | "policy" | "answer" | "approval" | "execute" | "handoff" | "draft" | "notify";

export interface Person {
  name: string;
  initials: string;
  role: string;
}

export interface Persona extends Person {
  id: PersonaId;
  /** Fixed fictional grants from demo_personas.json, shown in the persona chip. */
  scope: string;
}

export type Tone = "ok" | "warn" | "bad" | "info";

export interface Chip {
  text: string;
  tone: Tone;
}

export type Pair = [string, string];

export interface Tile {
  value: string;
  label: string;
  tone?: Tone;
}

export interface RequestCard {
  title: string;
  /** Where the personal data came from, e.g. "Sprout Solutions · record as of Oct 15, 09:00 PHT". */
  record: string;
  tiles?: Tile[];
  rows: Pair[];
  chips?: Chip[];
  confirm: string;
}

export interface PolicyCheck {
  label: string;
  detail: string;
  tone: "ok" | "warn" | "bad";
}

export interface Approval {
  by: PersonaId;
  role: string;
}

export interface ExecStep {
  system: string;
  title: string;
  detail: string;
}

export interface Handoff {
  queue: string;
  owner: Person;
  caseId: string;
  priority?: string;
  nextStep: string;
}

export interface Artifact {
  title: string;
  banner: string;
  lines: string[];
}

/** A guardrail exchange the presenter can trigger ("Try this"). It never changes the main request. */
export interface Branch {
  label: string;
  /** Ask as a different persona, e.g. Ana asking for a restricted case. Defaults to the requester. */
  as?: PersonaId;
  prompt: string;
  reply: string;
  event: string;
  tone: "deny" | "hold" | "info";
  sources?: SourceId[];
  /** Only available once the main request has finished (e.g. a second booking of the same desk). */
  afterDone?: boolean;
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  domain: Domain;
  mode: Mode;
  useCase: string;
  requester: PersonaId;
  minutes: string;
  steps: StepKey[];
  prompt: string;
  reply: string;
  sources: SourceId[];
  card: RequestCard;
  checks: PolicyCheck[];
  submitted?: string;
  approvals: Approval[];
  exec: ExecStep[];
  handoff?: Handoff;
  artifact?: Artifact;
  /** Who the right-hand phone shows when nobody has to approve (e.g. the Workplace coordinator). */
  observer?: Person;
  done: string;
  evidence: string[];
  branches: Branch[];
}

export interface ChatMessage {
  id: number;
  from: "employee" | "bot";
  kind: "text" | "card" | "artifact";
  text: string;
  time: string;
  as?: PersonaId;
  sources?: SourceId[];
  tone?: Branch["tone"];
}

export interface AuditEntry {
  id: number;
  time: string;
  actor: string;
  event: string;
  tone?: "ok" | "bad" | "warn";
}

export interface Decision {
  by: PersonaId;
  decision: "approved" | "rejected";
  reason?: string;
  time: string;
}

export interface ScenarioState {
  stage: Stage;
  chat: ChatMessage[];
  audit: AuditEntry[];
  approvalIdx: number;
  decisions: Decision[];
  execDone: number;
  rejected: boolean;
  typing: boolean;
  branchesUsed: number[];
  clock: number;
  seq: number;
}

export interface DemoState {
  current: ScenarioId;
  channel: ChannelId;
  scenarios: Record<ScenarioId, ScenarioState>;
}
