"use client";

import { Fragment } from "react";
import { SOURCES, type SourceId } from "@/lib/demo/sources.generated";
import type { Artifact, RequestCard as Card, ScenarioState } from "@/lib/demo/types";

export function SourceChips({ ids, onOpen }: { ids?: SourceId[]; onOpen: (id: SourceId) => void }) {
  if (!ids?.length) return null;
  return (
    <div className="srcchips">
      {ids.map((id) => {
        const s = SOURCES[id];
        return (
          <button key={id} type="button" className="srcchip" onClick={() => onOpen(id)}>
            <span className="srcdoc">
              {s.documentId} v{s.version}
            </span>
            {s.section}
          </button>
        );
      })}
    </div>
  );
}

function statusOf(state: ScenarioState, hasApprovals: boolean): [string, string] {
  if (state.rejected) return ["bad", "Rejected"];
  if (state.stage === "approval") return ["wait", "Waiting for approval"];
  if (state.stage === "executing") return ["run", "Processing"];
  if (state.stage === "done") return ["ok", hasApprovals ? "Completed" : "Done"];
  return ["wait", "Draft"];
}

/** The request card: editable stage shows Confirm; afterwards it becomes a status summary. */
export function RequestCard({
  card,
  state,
  hasApprovals,
  onConfirm,
}: {
  card: Card;
  state: ScenarioState;
  hasApprovals: boolean;
  onConfirm: () => void;
}) {
  const reviewing = state.stage === "review";
  const [pill, label] = statusOf(state, hasApprovals);
  return (
    <div className="card">
      <div className="card-h">
        <strong>{card.title}</strong>
        {!reviewing && <span className={`pill ${pill}`}>{label}</span>}
      </div>
      <div className="card-b">
        <p className="src rec">{card.record}</p>
        {card.tiles && (
          <div className="tiles">
            {card.tiles.map((t) => (
              <div className={`tile ${t.tone ?? ""}`} key={t.label}>
                <b>{t.value}</b>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        )}
        <dl className="kv">
          {card.rows.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
        {card.chips && (
          <div className="chips">
            {card.chips.map((c) => (
              <span key={c.text} className={`chip ${c.tone}`}>
                {c.text}
              </span>
            ))}
          </div>
        )}
        {reviewing && (
          <button className="btn" type="button" onClick={onConfirm}>
            {card.confirm}
          </button>
        )}
      </div>
    </div>
  );
}

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <div className="card artifact">
      <div className="card-h">
        <strong>{artifact.title}</strong>
        <span className="pill wait">Unsigned</span>
      </div>
      <div className="card-b doc">
        <p className="docmark" aria-hidden="true">
          FICTIONAL · NOT VALID FOR EXTERNAL USE
        </p>
        <p className="docco">SYDKYK</p>
        <p className="docbanner">{artifact.banner}</p>
        {artifact.lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    </div>
  );
}
