"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { CHANNELS } from "@/lib/demo/channels";
import { firstName, formatClock } from "@/lib/demo/format";
import { PERSONAS } from "@/lib/demo/personas";
import type { ChannelId, Person, Scenario, ScenarioState } from "@/lib/demo/types";
import type { Notice } from "@/lib/demo/use-demo";
import { PushNotice, StatusBar, SystemsChain, TabBar } from "./chrome";
import { PlatformLogo } from "./platform-logo";

interface Props {
  scenario: Scenario;
  state: ScenarioState;
  channel: ChannelId;
  notice?: Notice;
  /** Hidden on narrow screens when another panel tab is selected. */
  off?: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

/** Whose phone this is right now: the pending approver, the handoff queue, or whoever observes the outcome. */
function reviewerFor(scenario: Scenario, state: ScenarioState): Person {
  const { approvals, handoff, observer } = scenario;
  if (approvals.length) return PERSONAS[approvals[Math.min(state.approvalIdx, approvals.length - 1)].by];
  if (handoff) return handoff.owner;
  return observer ?? { name: "Service team", initials: "ST", role: "Service queue" };
}

function Decision({ scenario, state, onApprove, onReject }: Pick<Props, "scenario" | "state" | "onApprove" | "onReject">) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const approval = scenario.approvals[state.approvalIdx];

  useEffect(() => {
    if (rejecting) reasonRef.current?.focus();
  }, [rejecting]);

  if (!rejecting) {
    return (
      <div className="actions">
        <button className="btn ok" type="button" onClick={onApprove}>
          Approve as {approval.role.toLowerCase()}
        </button>
        <button className="btn line" type="button" onClick={() => setRejecting(true)}>
          Reject
        </button>
        <span className="guard">Nothing changes in any system until every required approval is recorded.</span>
      </div>
    );
  }
  return (
    <div>
      <label className="f">
        Reason (required, sent to {firstName(PERSONAS[scenario.requester].name)})
        <textarea
          id="reject-why"
          ref={reasonRef}
          value={reason}
          aria-invalid={!!error}
          aria-describedby={error ? "reject-err" : undefined}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
        />
      </label>
      {error && (
        <p className="err" id="reject-err">
          {error}
        </p>
      )}
      <div className="actions" style={{ marginTop: 8 }}>
        <button
          className="btn danger"
          type="button"
          onClick={() => (reason.trim() ? onReject(reason.trim()) : setError("Add a reason so the requester knows what to change."))}
        >
          Reject request
        </button>
        <button className="btn line" type="button" onClick={() => setRejecting(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ApprovalTrail({ scenario, state }: { scenario: Scenario; state: ScenarioState }) {
  if (!scenario.approvals.length) return null;
  return (
    <div>
      <p className="sec-l">Approvals</p>
      <ol className="exec">
        {scenario.approvals.map((a, i) => {
          const d = state.decisions[i];
          const cls = d?.decision === "approved" ? "done" : d?.decision === "rejected" ? "bad" : i === state.approvalIdx && state.stage === "approval" ? "run" : "";
          return (
            <li key={a.by + a.role} className={cls}>
              <span className="ic" aria-hidden="true">
                {d?.decision === "approved" ? "✓" : d?.decision === "rejected" ? "✕" : ""}
              </span>
              <div>
                {PERSONAS[a.by].name} · {a.role}
                <small>
                  {d ? `${d.decision === "approved" ? "Approved" : "Rejected"} ${d.time}` : i === state.approvalIdx && state.stage === "approval" ? "Waiting" : "Not yet"}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ApproverPane({ scenario, state, channel, notice, off, onApprove, onReject }: Props) {
  const ch = CHANNELS[channel];
  const reviewer = reviewerFor(scenario, state);
  const systems = [ch.name, ...Array.from(new Set(scenario.exec.map((e) => e.system)))];
  const submitted = state.stage === "approval" || state.stage === "executing" || state.stage === "done";
  const requester = PERSONAS[scenario.requester];

  const [pillClass, pillLabel] = state.rejected
    ? ["bad", "Rejected"]
    : state.stage === "approval"
      ? ["wait", "Needs your approval"]
      : state.stage === "executing"
        ? ["run", "Executing (mock)"]
        : scenario.handoff
          ? ["wait", "Human review pending"]
          : ["ok", "Completed"];

  const route = scenario.approvals.length
    ? scenario.approvals.map((a) => `${PERSONAS[a.by].name.split(" ")[0]} (${a.role.toLowerCase()})`).join(" → ")
    : scenario.handoff
      ? `${scenario.handoff.queue}`
      : "No approval needed";

  return (
    <section className={`pane ch-${channel}${off ? " tab-off" : ""}`} aria-label="Approver view" id="approver">
      <div className="device">
        <StatusBar time={formatClock(state.clock, "bare")} />
        <PushNotice notice={notice} />
        <div className="pane-head">
          <div className="av" aria-hidden="true">
            {reviewer.initials}
          </div>
          <div className="who">
            <strong>{reviewer.name}</strong>
            <span>{reviewer.role}</span>
          </div>
          <span className="tag sim">Simulated persona</span>
        </div>
        <div className="console" id="console">
          {!submitted ? (
            <div className="empty">
              <strong>Nothing to review yet</strong>
              When {firstName(requester.name)} confirms, it routes here: {route}.
              <div style={{ marginTop: 8 }}>
                <SystemsChain systems={systems} lead={<PlatformLogo channel={channel} size={14} />} />
              </div>
            </div>
          ) : (
            <article className="req">
              <div className="req-h">
                <h2>{scenario.card.title}</h2>
                <span className={`pill ${pillClass}`}>{pillLabel}</span>
              </div>
              <div className="req-b">
                <dl className="kv">
                  <dt>Requester</dt>
                  <dd>{requester.name}</dd>
                  {scenario.card.rows.map(([k, v]) => (
                    <Fragment key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </Fragment>
                  ))}
                </dl>
                <div>
                  <p className="sec-l">Policy checks by Sydkyk</p>
                  <ul className="checks">
                    {scenario.checks.map((c) => (
                      <li key={c.label} className={c.tone}>
                        <div>
                          {c.label}
                          <small>{c.detail}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <ApprovalTrail scenario={scenario} state={state} />
                {state.stage === "approval" && <Decision key={state.approvalIdx} scenario={scenario} state={state} onApprove={onApprove} onReject={onReject} />}
                {scenario.exec.length > 0 && (state.stage === "executing" || state.stage === "done") && !state.rejected && (
                  <div>
                    <p className="sec-l">Execution</p>
                    <ol className="exec">
                      {scenario.exec.map((e, i) => {
                        const cls = i < state.execDone ? "done" : i === state.execDone && state.stage === "executing" ? "run" : "";
                        return (
                          <li key={e.title} className={cls}>
                            <span className="ic" aria-hidden="true">
                              {cls === "done" ? "✓" : ""}
                            </span>
                            <div>
                              {e.title} <span className="mock">{e.system} · Mock</span>
                              <small>{e.detail}</small>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
                {scenario.handoff && state.stage === "done" && !state.rejected && (
                  <div className="case">
                    <p className="sec-l">Human handoff</p>
                    <dl className="kv">
                      <dt>Case</dt>
                      <dd>{scenario.handoff.caseId} (mock)</dd>
                      <dt>Queue</dt>
                      <dd>{scenario.handoff.queue}</dd>
                      {scenario.handoff.priority && (
                        <>
                          <dt>Priority</dt>
                          <dd>{scenario.handoff.priority}</dd>
                        </>
                      )}
                      <dt>Next step</dt>
                      <dd>{scenario.handoff.nextStep}</dd>
                    </dl>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
        <TabBar items={["Approvals", "Team", "Reports", "Me"]} />
      </div>
    </section>
  );
}
