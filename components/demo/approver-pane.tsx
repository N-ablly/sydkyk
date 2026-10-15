"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { CHANNELS } from "@/lib/demo/channels";
import { firstName, formatClock } from "@/lib/demo/format";
import type { ChannelId, Scenario, ScenarioState } from "@/lib/demo/types";
import type { Notice } from "@/lib/demo/use-demo";
import { PushNotice, StatusBar, SystemsChain, TabBar } from "./chrome";

interface Props {
  scenario: Scenario;
  state: ScenarioState;
  channel: ChannelId;
  notice?: Notice;
  onApprove: () => void;
  onDecline: (reason: string) => void;
}

function Decision({ scenario, onApprove, onDecline }: Pick<Props, "scenario" | "onApprove" | "onDecline">) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState(scenario.declineDraft);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (declining) reasonRef.current?.focus();
  }, [declining]);

  if (!declining) {
    return (
      <div className="actions">
        <button className="btn ok" type="button" onClick={onApprove}>
          Approve
        </button>
        <button className="btn line" type="button" onClick={() => setDeclining(true)}>
          Decline
        </button>
        <span className="guard">Sydkyk can’t change {scenario.systemOfRecord} until you approve.</span>
      </div>
    );
  }
  return (
    <div>
      <label className="f">
        Reason (sent to {firstName(scenario.employee.name)})
        <textarea id="decline-why" ref={reasonRef} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="actions" style={{ marginTop: 8 }}>
        <button className="btn danger" type="button" onClick={() => onDecline(reason.trim() || "No reason given")}>
          Decline request
        </button>
        <button className="btn line" type="button" onClick={() => setDeclining(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function AuditLog({ state }: { state: ScenarioState }) {
  const logRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.audit.length]);

  return (
    <div className="audit">
      <div className="audit-h">
        <p className="sec-l" style={{ margin: 0 }}>
          Audit trail
        </p>
        <span className="meta">{state.audit.length ? `${state.audit.length} events` : ""}</span>
      </div>
      <ol className="log" ref={logRef}>
        {state.audit.length === 0 ? (
          <li>
            <time>—</time>
            <span className="actor" />
            <span className="ev" style={{ color: "var(--muted)" }}>
              Every request, check, approval and system change is recorded here.
            </span>
          </li>
        ) : (
          state.audit.map((a) => (
            <li key={a.id} className={a.tone === "ok" ? "w" : a.tone === "bad" ? "x" : undefined}>
              <time>{a.time}</time>
              <span className="actor">{a.actor}</span>
              <span className="ev">{a.event}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

export function ApproverPane({ scenario, state, channel, notice, onApprove, onDecline }: Props) {
  const ch = CHANNELS[channel];
  const systems = [ch.name, ...scenario.systems];
  const v = state.values;
  const showRequest = v && (state.stage === "pending" || state.stage === "executing" || state.stage === "done");

  const [pillClass, pillLabel] = state.rejected
    ? ["bad", "Declined"]
    : state.stage === "pending"
      ? ["wait", "Needs your approval"]
      : state.stage === "executing"
        ? ["run", "Executing"]
        : ["ok", "Completed"];

  return (
    <section className={`pane ch-${channel}`} aria-label="Approver view" id="approver">
      <div className="device">
        <StatusBar time={formatClock(state.clock, "bare")} />
        <PushNotice notice={notice} />
        <div className="pane-head">
          <div className="av" aria-hidden="true">
            {scenario.approver.initials}
          </div>
          <div className="who">
            <strong>{scenario.approver.name}</strong>
            <span>{scenario.approver.role}</span>
          </div>
          <span className="tag">{ch.approverTag}</span>
        </div>
        <div className="console" id="console">
          {!showRequest ? (
            <div className="empty">
              <strong>No requests waiting</strong>
              When {firstName(scenario.employee.name)} submits, the request shows up here with policy checks already done.
              <div style={{ marginTop: 8 }}>
                <SystemsChain systems={systems} />
              </div>
            </div>
          ) : (
            <article className="req">
              <div className="req-h">
                <h2>{scenario.title(v)}</h2>
                <span className={`pill ${pillClass}`}>{pillLabel}</span>
              </div>
              <div className="req-b">
                <dl className="kv">
                  {scenario.details(v).map(([k, val]) => (
                    <Fragment key={k}>
                      <dt>{k}</dt>
                      <dd>{val}</dd>
                    </Fragment>
                  ))}
                </dl>
                <div>
                  <p className="sec-l">Policy checks by Sydkyk</p>
                  <ul className="checks">
                    {scenario.checks(v).map(([k, d]) => (
                      <li key={k}>
                        <div>
                          {k}
                          <small>{d}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="sec-l">Systems touched</p>
                  <SystemsChain systems={systems} />
                </div>
                {state.stage === "pending" && (
                  <Decision scenario={scenario} onApprove={onApprove} onDecline={onDecline} />
                )}
                {(state.stage === "executing" || state.stage === "done") && !state.rejected && (
                  <div>
                    <p className="sec-l">Execution</p>
                    <ol className="exec">
                      {scenario.exec(v).map(([t, d], i) => {
                        const cls =
                          i < state.execDone ? "done" : i === state.execDone && state.stage === "executing" ? "run" : "";
                        return (
                          <li key={t} className={cls}>
                            <span className="ic" aria-hidden="true">
                              {cls === "done" ? "✓" : ""}
                            </span>
                            <div>
                              {t}
                              <small>{d}</small>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
        <TabBar items={["Approvals", "Team", "Reports", "Me"]} />
      </div>
      <AuditLog state={state} />
    </section>
  );
}
