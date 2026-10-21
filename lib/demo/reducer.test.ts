import { describe, expect, it } from "vitest";
import packScripts from "../../content/sydkyk-pack/scenarios.json";
import { businessDays } from "./format";
import { PERSONAS } from "./personas";
import { demoReducer, initialDemoState, stepStatus, type DemoAction } from "./reducer";
import { SCENARIOS, SCENARIO_ORDER } from "./scenarios";
import { SOURCES } from "./sources.generated";
import type { DemoState, ScenarioId } from "./types";

const open = (id: ScenarioId): DemoAction[] => [{ type: "select", id }, { type: "send" }, { type: "reply" }];
const run = (actions: DemoAction[], start: DemoState = initialDemoState()) => actions.reduce(demoReducer, start);
const execAll = (id: ScenarioId): DemoAction[] => [
  ...Array.from({ length: SCENARIOS[id].exec.length }, () => ({ type: "execStep" }) as const),
  { type: "finish" },
];

describe("scenario data matches the SYDKYK pack", () => {
  it.each(packScripts.map((p) => [p.scenario_id, p] as const))("%s uses the runbook persona, prompt and policy", (id, p) => {
    const sc = SCENARIOS[id as ScenarioId];
    expect(sc.requester).toBe(p.persona);
    expect(sc.sources.some((s) => s.startsWith(p.policy))).toBe(true);
    // Prompts may add thousands separators ("PHP 1,250") but keep the runbook wording.
    expect(sc.prompt.replace(/,(?=\d{3})/g, "")).toBe(p.prompt);
  });

  it("references only existing sources and personas", () => {
    for (const id of SCENARIO_ORDER) {
      const sc = SCENARIOS[id];
      for (const s of [...sc.sources, ...sc.branches.flatMap((b) => b.sources ?? [])]) expect(SOURCES[s], `${id} → ${s}`).toBeDefined();
      for (const a of sc.approvals) expect(PERSONAS[a.by]).toBeDefined();
      expect(sc.branches.length).toBeGreaterThan(0);
    }
  });
});

describe("approval flows", () => {
  it("S01 leave: one manager approval, then mock execution", () => {
    const s = run([...open("S01"), { type: "confirm" }, { type: "approve" }, ...execAll("S01")]).scenarios.S01;
    expect(s.stage).toBe("done");
    expect(s.decisions.map((d) => d.by)).toEqual(["E0002"]);
    expect(s.execDone).toBe(2);
    expect(s.chat.at(-1)?.text).toContain("9.0 still available");
  });

  it("S04 expense: Finance must approve after the manager before anything executes (AC13)", () => {
    const afterManager = run([...open("S04"), { type: "confirm" }, { type: "approve" }]).scenarios.S04;
    expect(afterManager.stage).toBe("approval");
    expect(afterManager.approvalIdx).toBe(1);
    expect(afterManager.execDone).toBe(0);
    const s = run([...open("S04"), { type: "confirm" }, { type: "approve" }, { type: "approve" }, ...execAll("S04")]).scenarios.S04;
    expect(s.decisions.map((d) => d.by)).toEqual(["E0002", "E0006"]);
    expect(s.audit.some((a) => a.event.includes("DEMO-BATCH-001"))).toBe(true);
  });

  it("S06 access: needs manager and app owner (AC14)", () => {
    const s = run([...open("S06"), { type: "confirm" }, { type: "approve" }, { type: "approve" }, ...execAll("S06")]).scenarios.S06;
    expect(s.decisions.map((d) => d.by)).toEqual(["E0002", "E0005"]);
    expect(s.audit.some((a) => a.event.includes("MOCK-IDP-001"))).toBe(true);
  });

  it("rejection records a reason and executes nothing", () => {
    const s = run([...open("S04"), { type: "confirm" }, { type: "reject", reason: "Wrong cost center" }]).scenarios.S04;
    expect(s.rejected).toBe(true);
    expect(s.execDone).toBe(0);
    expect(s.audit.some((a) => a.tone === "bad" && a.event.includes("Wrong cost center"))).toBe(true);
  });

  it("ignores out-of-order actions (no approval before confirmation, no double confirm)", () => {
    const s = run([...open("S01"), { type: "approve" }, { type: "confirm" }, { type: "confirm" }]).scenarios.S01;
    expect(s.decisions).toHaveLength(0);
    expect(s.audit.filter((a) => a.event.startsWith("Confirmed"))).toHaveLength(1);
  });
});

describe("certificate of employment (S03)", () => {
  it("after People Operations approves, says here is your COE and then shows the issued certificate", () => {
    const pending = run([...open("S03"), { type: "confirm" }]).scenarios.S03;
    expect(pending.chat.some((m) => m.kind === "artifact")).toBe(false);
    const s = run([...open("S03"), { type: "confirm" }, { type: "approve" }, ...execAll("S03")]).scenarios.S03;
    expect(s.decisions.map((d) => d.by)).toEqual(["E0007"]);
    expect(s.chat.at(-2)?.text).toContain("Here’s your Certificate of Employment, Ana");
    expect(s.chat.at(-1)?.kind).toBe("artifact");
    expect(SCENARIOS.S03.artifact?.kind).toBe("certificate");
  });

  it("a rejected COE request never shows a certificate", () => {
    const s = run([...open("S03"), { type: "confirm" }, { type: "reject", reason: "Start date needs correcting" }]).scenarios.S03;
    expect(s.chat.some((m) => m.kind === "artifact")).toBe(false);
  });
});

describe("handoffs never fake execution", () => {
  it.each(["S02", "S05", "S08", "S12"] as const)("%s ends in a human handoff with no mock execution", (id) => {
    const s = run([...open(id), { type: "confirm" }]).scenarios[id];
    expect(s.stage).toBe("done");
    expect(s.execDone).toBe(0);
    expect(SCENARIOS[id].exec).toHaveLength(0);
    expect(s.audit.some((a) => a.event.startsWith("Handoff created"))).toBe(true);
  });

  it("S11 drafts the NTE and hands it to ER & Legal; no approval or sending", () => {
    const s = run([...open("S11"), { type: "confirm" }, ...execAll("S11")]).scenarios.S11;
    expect(s.chat.some((m) => m.kind === "artifact")).toBe(true);
    expect(s.audit.some((a) => a.event.includes("ER-DEMO-001 → ER & Legal review"))).toBe(true);
    expect(s.decisions).toHaveLength(0);
  });
});

describe("guardrail branches", () => {
  it("answers as the switched persona and leaves the main request untouched", () => {
    const s = run([...open("S11"), { type: "branchAsk", index: 0 }, { type: "branchReply", index: 0 }]).scenarios.S11;
    expect(s.stage).toBe("review");
    expect(s.chat.at(-2)?.as).toBe("E0001");
    expect(s.chat.at(-1)?.text).toBe("I don’t have anything I can share for that.");
    expect(s.branchesUsed).toEqual([0]);
  });

  it("keeps after-done branches locked until the request finishes (S09 double booking)", () => {
    const early = run([...open("S09"), { type: "branchAsk", index: 0 }]).scenarios.S09;
    expect(early.typing).toBe(false);
    const late = run([...open("S09"), { type: "confirm" }, ...execAll("S09"), { type: "branchAsk", index: 0 }, { type: "branchReply", index: 0 }])
      .scenarios.S09;
    expect(late.chat.at(-1)?.text).toContain("already booked");
  });
});

describe("progress and switching", () => {
  it("answers stop at the answer step without a fake execution (S07)", () => {
    const s = run(open("S07")).scenarios.S07;
    expect(stepStatus(s, "answer", SCENARIOS.S07.steps)).toBe("done");
    expect(stepStatus(s, "handoff", SCENARIOS.S07.steps)).toBe("active");
  });

  it("uses the selected channel in audit events", () => {
    const s = run([{ type: "channel", channel: "slack" }, ...open("S01")]).scenarios.S01;
    expect(s.audit[0].event).toBe("Asked via Slack");
  });

  it("settles an in-flight execution when switching scenarios", () => {
    const state = run([...open("S01"), { type: "confirm" }, { type: "approve" }, { type: "select", id: "S02" }]);
    expect(state.current).toBe("S02");
    expect(state.scenarios.S01.stage).toBe("done");
  });

  it("restarts a scenario left while Sydkyk is typing", () => {
    const state = run([{ type: "send" }, { type: "select", id: "S03" }]);
    expect(state.scenarios.S01.stage).toBe("idle");
    expect(state.scenarios.S01.chat).toHaveLength(0);
  });
});

describe("businessDays", () => {
  it("counts weekdays inclusively", () => {
    expect(businessDays("2026-11-24", "2026-11-26")).toBe(3);
    expect(businessDays("2026-11-27", "2026-11-30")).toBe(2);
  });
});
