"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { CHANNELS, CHANNEL_ORDER } from "@/lib/demo/channels";
import { firstName } from "@/lib/demo/format";
import { SCENARIOS, SCENARIO_ORDER } from "@/lib/demo/scenarios";
import type { ChannelId, Scenario, ScenarioState } from "@/lib/demo/types";
import { useDemo } from "@/lib/demo/use-demo";
import { ApproverPane } from "./approver-pane";
import { Mascot } from "./chrome";
import { EmployeePane } from "./employee-pane";

const STEPS = ["Request", "Policy check", "Approval", "Execute", "Notify"];

function guideFor(scenario: Scenario, state: ScenarioState, channel: ChannelId): [string, string] {
  const e = firstName(scenario.employee.name);
  const a = firstName(scenario.approver.name);
  switch (state.stage) {
    case "idle":
      return ["Step 1", `${e} asks Sydkyk ${CHANNELS[channel].where}. Click the suggested message to send it.`];
    case "thinking":
      return ["Step 1", "Sydkyk works out what’s being asked and pulls only the data this employee is allowed to see."];
    case "review":
      return ["Step 2", "Sydkyk has filled in the request. Review the card in the chat, then send it."];
    case "pending":
      return [
        "Step 3",
        channel === "mobile"
          ? `Policy checks passed. ${a} gets a push notification and approves from their phone.`
          : `Policy checks passed. ${a} sees the request on the right. Approve or decline it.`,
      ];
    case "executing":
      return ["Step 4", "Approved. Sydkyk now updates each system in order and records every action."];
    case "done":
      return state.rejected
        ? ["Done", `${a} declined. ${e} was told why, and no system was changed.`]
        : ["Done", `Resolved in one conversation. ${e} was notified, and the audit trail shows every step.`];
  }
}

const STEP_INDEX: Record<ScenarioState["stage"], number> = {
  idle: -1,
  thinking: 0,
  review: 1,
  pending: 2,
  executing: 3,
  done: 5,
};

function stepClass(state: ScenarioState, i: number) {
  if (state.rejected) return i < 2 ? "done" : i === 2 ? "bad" : "";
  const idx = STEP_INDEX[state.stage];
  return i < idx ? "done" : i === idx ? "active" : "";
}

export function Demo() {
  const demo = useDemo();
  const { state, scenario, current } = demo;
  const [label, text] = guideFor(scenario, current, state.channel);
  const tabsRef = useRef<HTMLDivElement>(null);

  // On narrow screens the approver pane sits below the chat; bring it into view when a request arrives.
  useEffect(() => {
    if (current.stage === "pending" && window.matchMedia("(max-width: 979px)").matches) {
      document.getElementById("approver")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [current.stage]);

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = SCENARIO_ORDER.indexOf(state.current);
    const n = SCENARIO_ORDER[(i + (e.key === "ArrowRight" ? 1 : SCENARIO_ORDER.length - 1)) % SCENARIO_ORDER.length];
    demo.select(n);
    tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${n}"]`)?.focus();
  };

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <Mascot />
          <div>
            <h1>Sydkyk</h1>
            <small>THE AUTONOMOUS AI TEAMMATE · LIVE DEMO</small>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Demo scenarios" ref={tabsRef} onKeyDown={onTabKey}>
          {SCENARIO_ORDER.map((id) => {
            const s = state.scenarios[id];
            const dot = s.stage === "done" ? "done" : s.stage !== "idle" ? "live" : "";
            return (
              <button
                key={id}
                className="tab"
                role="tab"
                type="button"
                data-tab={id}
                aria-selected={id === state.current}
                tabIndex={id === state.current ? 0 : -1}
                onClick={() => demo.select(id)}
              >
                <i className={`dot ${dot}`} aria-hidden="true" />
                {SCENARIOS[id].label}
              </button>
            );
          })}
        </div>
        <div className="tabs" role="group" aria-label="Channel">
          <span className="chlabel">Channel</span>
          {CHANNEL_ORDER.map((id) => (
            <button
              key={id}
              className="tab chan"
              type="button"
              aria-pressed={id === state.channel}
              onClick={() => demo.setChannel(id)}
            >
              {CHANNELS[id].label}
            </button>
          ))}
        </div>
        <button className="ghost" type="button" onClick={demo.reset}>
          Reset scenario
        </button>
      </header>

      <section className="guide" aria-live="polite">
        <span className="lbl">{label}</span>
        <p>{text}</p>
        <ol className="steps">
          {STEPS.map((name, i) => {
            const cls = stepClass(current, i);
            return (
              <li key={name} className={cls}>
                {cls === "done" ? "✓ " : ""}
                {name}
              </li>
            );
          })}
        </ol>
      </section>

      <main className="panes">
        <EmployeePane
          key={`emp-${state.current}`}
          scenario={scenario}
          state={current}
          channel={state.channel}
          notice={demo.notices.employee}
          onSend={demo.send}
          onSubmit={demo.submit}
        />
        <ApproverPane
          key={`apr-${state.current}-${current.stage === "idle" ? "new" : "run"}`}
          scenario={scenario}
          state={current}
          channel={state.channel}
          notice={demo.notices.approver}
          onApprove={demo.approve}
          onDecline={demo.decline}
        />
      </main>

      <p className="foot">
        Illustrative demo with sample data. No chat, HR, finance or identity systems are connected, and nothing is
        written anywhere.
      </p>
    </div>
  );
}
