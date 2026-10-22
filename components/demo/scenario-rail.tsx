"use client";

import { useId, useState } from "react";
import { PERSONAS } from "@/lib/demo/personas";
import { DOMAINS, MODE_LABEL, PILLARS, SCENARIOS, SCENARIO_ORDER } from "@/lib/demo/scenarios";
import type { Domain, DemoState, Pillar, ScenarioId } from "@/lib/demo/types";

interface Props {
  state: DemoState;
  onSelect: (id: ScenarioId) => void;
}

export function ScenarioRail({ state, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [pillar, setPillar] = useState<Pillar | "All">("All");
  const [domain, setDomain] = useState<Domain | "All">("All");
  const searchId = useId();
  const q = query.trim().toLowerCase();

  const visible = SCENARIO_ORDER.filter((id) => {
    const s = SCENARIOS[id];
    if (pillar !== "All" && s.pillar !== pillar) return false;
    if (domain !== "All" && s.domain !== domain) return false;
    if (!q) return true;
    return [s.title, s.prompt, s.domain, s.pillar, MODE_LABEL[s.mode], PERSONAS[s.requester].name].join(" ").toLowerCase().includes(q);
  });

  return (
    <nav className="rail" aria-label="Demo scenarios">
      <label className="f" htmlFor={searchId}>
        Find a scenario
        <input id={searchId} type="search" value={query} placeholder="Leave, survey, announcement…" onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="dfilter" role="group" aria-label="Filter by pillar">
        {(["All", ...PILLARS] as const).map((p) => (
          <button key={p} type="button" aria-pressed={pillar === p} onClick={() => setPillar(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="dfilter" role="group" aria-label="Filter by area">
        {(["All", ...DOMAINS] as const).map((d) => (
          <button key={d} type="button" aria-pressed={domain === d} onClick={() => setDomain(d)}>
            {d}
          </button>
        ))}
      </div>
      <ul className="slist">
        {visible.map((id) => {
          const s = SCENARIOS[id];
          const st = state.scenarios[id];
          const status = st.stage === "done" ? "done" : st.stage !== "idle" ? "live" : "";
          return (
            <li key={id}>
              <button type="button" className="sitem" aria-current={id === state.current ? "true" : undefined} onClick={() => onSelect(id)}>
                <span className="srow">
                  <span className="sid">{id}</span>
                  <strong>{s.title}</strong>
                  <i className={`dot ${status}`} aria-label={status === "done" ? "finished" : status === "live" ? "in progress" : undefined} />
                </span>
                <span className="smeta">
                  <span className={`mode m-${s.mode}`}>{MODE_LABEL[s.mode]}</span>
                  {PERSONAS[s.requester].name.split(" ")[0]} · {s.minutes}
                </span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && <li className="meta">No scenario matches “{query}”.</li>}
      </ul>
    </nav>
  );
}
