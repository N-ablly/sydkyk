"use client";

import { useEffect, useRef } from "react";
import { PERSONAS } from "@/lib/demo/personas";
import type { SourceId } from "@/lib/demo/sources.generated";
import type { Scenario, ScenarioState } from "@/lib/demo/types";
import { SourceChips } from "./request-card";

interface Props {
  scenario: Scenario;
  state: ScenarioState;
  /** Hidden on narrow screens when another panel tab is selected. */
  off?: boolean;
  onBranch: (index: number) => void;
  onSource: (id: SourceId) => void;
}

export function EvidencePanel({ scenario, state, off, onBranch, onSource }: Props) {
  const logRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.audit.length]);

  const started = state.stage !== "idle" && state.stage !== "thinking";

  return (
    <section className={off ? "evidence tab-off" : "evidence"} aria-label="Evidence" id="evidence">
      <div className="ev-col">
        <div className="ev-block">
          <p className="sec-l">Try a guardrail</p>
          <p className="meta">Ask something Sydkyk must refuse, hold or hand to a person. The main request isn’t affected.</p>
          <div className="branches">
            {scenario.branches.map((b, i) => {
              const locked = !started || state.typing || (b.afterDone && state.stage !== "done");
              return (
                <button
                  key={b.label}
                  type="button"
                  className={state.branchesUsed.includes(i) ? "branch used" : "branch"}
                  disabled={locked}
                  title={b.afterDone && state.stage !== "done" ? "Available after the main request finishes" : undefined}
                  onClick={() => onBranch(i)}
                >
                  {b.label}
                  {b.as && <small>as {PERSONAS[b.as].name.split(" ")[0]}</small>}
                </button>
              );
            })}
          </div>
          {!started && <p className="meta">Send the first message to unlock these.</p>}
        </div>
        <div className="ev-block">
          <p className="sec-l">Sources for this scenario</p>
          <SourceChips ids={scenario.sources} onOpen={onSource} />
        </div>
        <div className="ev-block">
          <p className="sec-l">Outcome evidence</p>
          {state.stage === "done" ? (
            <ul className="evlist">
              {(state.rejected ? ["Rejected with a recorded reason.", "Reservation released; no system changed."] : scenario.evidence).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : (
            <p className="meta">Shown when the scenario finishes.</p>
          )}
        </div>
      </div>
      <div className="audit">
        <div className="audit-h">
          <p className="sec-l" style={{ margin: 0 }}>
            Audit trail
          </p>
          <span className="meta">{state.audit.length ? `${state.audit.length} events · Manila time` : ""}</span>
        </div>
        <ol className="log" ref={logRef}>
          {state.audit.length === 0 ? (
            <li>
              <time>—</time>
              <span className="actor" />
              <span className="ev" style={{ color: "var(--muted)" }}>
                Every question, check, approval and system step is recorded here.
              </span>
            </li>
          ) : (
            state.audit.map((a) => (
              <li key={a.id} className={a.tone === "ok" ? "w" : a.tone === "bad" ? "x" : a.tone === "warn" ? "y" : undefined}>
                <time>{a.time}</time>
                <span className="actor">{a.actor}</span>
                <span className="ev">{a.event}</span>
              </li>
            ))
          )}
        </ol>
      </div>
    </section>
  );
}
