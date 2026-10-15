import { describe, expect, it } from "vitest";
import { businessDays } from "./format";
import { demoReducer, initialDemoState, type DemoAction } from "./reducer";
import { SCENARIOS } from "./scenarios";
import type { DemoState, LeaveValues } from "./types";

const leaveValues: LeaveValues = {
  type: "Vacation leave",
  from: "2026-11-24",
  to: "2026-11-26",
  note: "",
  days: 3,
  balance: 12,
};

const run = (actions: DemoAction[], start: DemoState = initialDemoState()) => actions.reduce(demoReducer, start);

describe("businessDays", () => {
  it("counts weekdays inclusively", () => {
    expect(businessDays("2026-11-24", "2026-11-26")).toBe(3);
    expect(businessDays("2026-11-27", "2026-11-30")).toBe(2); // Fri → Mon
  });
  it("returns 0 for reversed or invalid ranges", () => {
    expect(businessDays("2026-11-26", "2026-11-24")).toBe(0);
    expect(businessDays("", "2026-11-24")).toBe(0);
  });
});

describe("demoReducer", () => {
  it("walks the full approval flow and records every execution step", () => {
    const steps = SCENARIOS.leave.exec(leaveValues).length;
    const state = run([
      { type: "send" },
      { type: "reply" },
      { type: "submit", values: leaveValues },
      { type: "approve" },
      ...Array.from({ length: steps }, () => ({ type: "execStep" }) as const),
      { type: "finish" },
    ]);
    const s = state.scenarios.leave;
    expect(s.stage).toBe("done");
    expect(s.execDone).toBe(steps);
    expect(s.audit.filter((a) => a.event.startsWith("Policy check passed"))).toHaveLength(3);
    expect(s.audit.at(-1)?.event).toBe("Employee notified in Teams");
    expect(s.chat.at(-1)?.text).toContain("Approved by Mark");
  });

  it("ignores actions that are out of order", () => {
    const state = run([{ type: "approve" }, { type: "submit", values: leaveValues }]);
    expect(state.scenarios.leave.stage).toBe("idle");
    expect(state.scenarios.leave.audit).toHaveLength(0);
  });

  it("declines without executing anything", () => {
    const state = run([
      { type: "send" },
      { type: "reply" },
      { type: "submit", values: leaveValues },
      { type: "decline", reason: "Busy week" },
    ]);
    const s = state.scenarios.leave;
    expect(s.rejected).toBe(true);
    expect(s.execDone).toBe(0);
    expect(s.audit.some((a) => a.tone === "bad" && a.event.includes("Busy week"))).toBe(true);
  });

  it("uses the selected channel in audit events", () => {
    const state = run([{ type: "channel", channel: "mobile" }, { type: "send" }, { type: "reply" }, { type: "submit", values: leaveValues }]);
    const events = state.scenarios.leave.audit.map((a) => a.event);
    expect(events[0]).toBe("Request received via Mobile app");
    expect(events).toContain("Push notification sent to Mark Santos’s phone");
  });

  it("names Slack in audit events", () => {
    const state = run([{ type: "channel", channel: "slack" }, { type: "send" }]);
    expect(state.scenarios.leave.audit[0].event).toBe("Request received via Slack");
  });

  it("settles a scenario that is left mid-execution", () => {
    const state = run([
      { type: "send" },
      { type: "reply" },
      { type: "submit", values: leaveValues },
      { type: "approve" },
      { type: "select", id: "expense" },
    ]);
    expect(state.current).toBe("expense");
    expect(state.scenarios.leave.stage).toBe("done");
  });

  it("restarts a scenario that is left while Sydkyk is typing", () => {
    const state = run([{ type: "send" }, { type: "select", id: "access" }]);
    expect(state.scenarios.leave.stage).toBe("idle");
    expect(state.scenarios.leave.chat).toHaveLength(0);
  });
});
