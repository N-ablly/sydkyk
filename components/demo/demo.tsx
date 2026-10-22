"use client";

import { useState } from "react";
import { CHANNELS, CHANNEL_ORDER } from "@/lib/demo/channels";
import { firstName, formatClock } from "@/lib/demo/format";
import { PERSONAS } from "@/lib/demo/personas";
import { stepStatus } from "@/lib/demo/reducer";
import { MODE_LABEL } from "@/lib/demo/scenarios";
import type { SourceRef } from "@/lib/rag/types";
import type { ChannelId, Scenario, ScenarioId, ScenarioState, StepKey } from "@/lib/demo/types";
import { useDemo } from "@/lib/demo/use-demo";
import { ApproverPane } from "./approver-pane";
import { Mascot } from "./chrome";
import { EmployeePane } from "./employee-pane";
import { EvidencePanel } from "./evidence-panel";
import { PlatformLogo } from "./platform-logo";
import { ScenarioRail } from "./scenario-rail";
import { SourceDrawer } from "./source-drawer";

const STEP_LABEL: Record<StepKey, string> = {
  request: "Request",
  policy: "Policy check",
  answer: "Answer",
  approval: "Approval",
  execute: "Execute",
  handoff: "Handoff",
  draft: "Draft",
  notify: "Notify",
};

type MobileTab = "employee" | "approver" | "evidence";

function guideFor(sc: Scenario, st: ScenarioState): [string, string] {
  const who = firstName(PERSONAS[sc.requester].name);
  switch (st.stage) {
    case "idle":
      return ["Start", `${who} asks Sydkyk. Click the suggested message in the left phone to send it.`];
    case "thinking":
      return ["Checking", `Sydkyk checks what ${who} is allowed to see, reads the record and retrieves the policy.`];
    case "review":
      return sc.mode === "answer"
        ? ["Answered", `Answered from ${who}'s own record and the cited policy. Opening a follow-up is optional.`]
        : ["Review", `Nothing is submitted until ${who} confirms the card. Open a source chip to see the policy text.`];
    case "approval": {
      const a = sc.approvals[st.approvalIdx];
      return ["Approval", `${firstName(PERSONAS[a.by].name)} reviews as ${a.role.toLowerCase()} in the right phone. Rejecting needs a reason.`];
    }
    case "executing":
      return ["Executing", "Every required approval is recorded. Mock adapters now run each step in order."];
    case "done":
      if (st.rejected) return ["Done", `Rejected with a reason. ${who} was told, and nothing changed in any system.`];
      if (sc.handoff) return ["Done", `Handed to ${sc.handoff.queue}. A person decides from here; Sydkyk doesn't.`];
      return ["Done", "Finished. Check the outcome evidence, then try a guardrail below."];
  }
}

export function Demo({ initialScenario }: { initialScenario?: ScenarioId }) {
  const demo = useDemo(initialScenario);
  const { state, scenario, current } = demo;
  const [source, setSource] = useState<SourceRef | null>(null);
  const [tab, setTab] = useState<MobileTab>("employee");
  const [label, text] = guideFor(scenario, current);
  const requester = PERSONAS[scenario.requester];

  // On narrow screens only one panel shows; follow the action to the phone that needs attention.
  // Adjusting state during render (not in an effect) avoids an extra render pass.
  const stageKey = `${state.current}:${current.stage}:${current.approvalIdx}`;
  const [seenKey, setSeenKey] = useState(stageKey);
  if (seenKey !== stageKey) {
    setSeenKey(stageKey);
    // Approval happens on the approver's phone; everything else, including the finished result
    // (e.g. the issued certificate), is shown to the requester.
    if (current.stage === "approval") setTab("approver");
    else if (current.stage !== "executing") setTab("employee");
  }

  const select = demo.select;

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <Mascot />
          <div>
            <h1>Sydkyk</h1>
            <small>THE AUTONOMOUS AI TEAMMATE · ENTERPRISE DEMO</small>
          </div>
        </div>
        <div className="tabs" role="group" aria-label="Channel preview">
          <span className="chlabel">Channel preview</span>
          {CHANNEL_ORDER.map((id: ChannelId) => (
            <button key={id} className="tab chan" type="button" aria-pressed={id === state.channel} onClick={() => demo.setChannel(id)}>
              <PlatformLogo channel={id} />
              {CHANNELS[id].label}
            </button>
          ))}
        </div>
        <span className="clock" title="The demo clock is frozen so every run gives the same results">
          Thu Oct 15, 2026 · {formatClock(current.clock)} PHT
        </span>
        <button className="ghost" type="button" onClick={demo.reset}>
          Reset scenario
        </button>
      </header>

      <div className="layout">
        <ScenarioRail state={state} onSelect={select} />

        <div className="stagearea">
          <section className="intro" aria-live="polite">
            <div className="intro-h">
              <span className="sid big">{scenario.id}</span>
              <h2>{scenario.title}</h2>
              <span className={`mode m-${scenario.mode}`}>{MODE_LABEL[scenario.mode]}</span>
              <span className="meta">
                {requester.name} · {scenario.pillar} · {scenario.domain} · {scenario.minutes}
              </span>
            </div>
            <div className="guide">
              <span className="lbl">{label}</span>
              <p>{text}</p>
              <ol className="steps">
                {scenario.steps.map((k) => {
                  const cls = stepStatus(current, k, scenario.steps);
                  return (
                    <li key={k} className={cls}>
                      {cls === "done" ? "✓ " : cls === "bad" ? "✕ " : ""}
                      {STEP_LABEL[k]}
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <div className="mtabs" role="tablist" aria-label="Demo panels">
            {(
              [
                ["employee", firstName(requester.name)],
                ["approver", "Approver"],
                ["evidence", "Evidence"],
              ] as const
            ).map(([id, name]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {name}
              </button>
            ))}
          </div>

          <main className="panes">
            <EmployeePane
              scenario={scenario}
              state={current}
              channel={state.channel}
              notice={demo.notices.employee}
              off={tab !== "employee"}
              onSend={demo.send}
              onConfirm={demo.confirm}
              onAsk={demo.ask}
              onSource={setSource}
            />
            <ApproverPane
              key={scenario.id}
              scenario={scenario}
              state={current}
              channel={state.channel}
              notice={demo.notices.approver}
              off={tab !== "approver"}
              onApprove={demo.approve}
              onReject={demo.reject}
            />
          </main>

          <EvidencePanel scenario={scenario} state={current} off={tab !== "evidence"} onBranch={demo.branch} onSource={setSource} />
        </div>
      </div>

      <p className="foot">
        Built from the SYDKYK enterprise pack (policies v1.1). Fictional content, not legal advice. Vendor names describe the intended
        integration design only; no vendor API is connected or validated.
      </p>
      <SourceDrawer source={source} onClose={() => setSource(null)} />
    </div>
  );
}
