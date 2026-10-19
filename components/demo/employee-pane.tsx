"use client";

import { useEffect, useRef } from "react";
import { CHANNEL_TABS, CHANNELS } from "@/lib/demo/channels";
import { formatClock } from "@/lib/demo/format";
import type { ChannelId, ChatMessage, RequestValues, Scenario, ScenarioState } from "@/lib/demo/types";
import type { Notice } from "@/lib/demo/use-demo";
import { BotAvatar, PushNotice, StatusBar, TabBar } from "./chrome";
import { PlatformLogo } from "./platform-logo";
import { RequestForm } from "./request-forms";

interface Props {
  scenario: Scenario;
  state: ScenarioState;
  channel: ChannelId;
  notice?: Notice;
  onSend: () => void;
  onSubmit: (values: RequestValues) => void;
}

function RequestSummary({ scenario, state }: { scenario: Scenario; state: ScenarioState }) {
  if (!state.values) return null;
  const [cls, label] = state.rejected
    ? ["bad", "Declined"]
    : state.stage === "done"
      ? ["ok", "Done"]
      : ["wait", "Waiting for approval"];
  return (
    <div className="card">
      <div className="card-h">
        <strong>{scenario.title(state.values)}</strong>
        <span className={`pill ${cls}`}>{label}</span>
      </div>
      <div className="card-b">
        <dl className="kv">
          {scenario
            .details(state.values)
            .slice(1)
            .map(([k, v]) => (
              <Pair key={k} k={k} v={v} />
            ))}
        </dl>
      </div>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}

export function EmployeePane({ scenario, state, channel, notice, onSend, onSubmit }: Props) {
  const chatRef = useRef<HTMLDivElement>(null);
  const ch = CHANNELS[channel];
  const tabs = CHANNEL_TABS[channel];

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.chat.length, state.stage, scenario.id, channel]);

  const renderMessage = (m: ChatMessage) => {
    const me = m.from === "employee";
    let inner;
    if (m.kind === "card") {
      inner =
        state.stage === "review" ? (
          <RequestForm scenario={scenario.id} onSubmit={onSubmit} />
        ) : (
          <RequestSummary scenario={scenario} state={state} />
        );
    } else {
      inner = <div className="bubble">{m.text}</div>;
    }
    return (
      <div key={m.id} className={me ? "msg me" : "msg"}>
        {me ? (
          <div className="av" aria-hidden="true">
            {scenario.employee.initials}
          </div>
        ) : (
          <BotAvatar />
        )}
        <div className="body">
          <span className="meta">
            <span className="nm">{me ? scenario.employee.name : "Sydkyk"}</span>
            {!me && (channel === "gchat" || channel === "slack") && <span className="appbadge">App</span>}
            {channel === "slack" ? " " : " · "}
            {m.time}
          </span>
          {inner}
        </div>
      </div>
    );
  };

  return (
    <section className={`pane ch-${channel}`} aria-label="Employee view" id="emp-pane">
      <div className="device">
        <StatusBar time={formatClock(state.clock, "bare")} />
        <PushNotice notice={notice} />
        <div className="pane-head">
          <BotAvatar />
          <div className="who">
            <strong>Sydkyk</strong>
            <span>
              Chat with {scenario.employee.name} · {scenario.employee.role}
            </span>
          </div>
          <span className="tag">
            <PlatformLogo channel={channel} size={14} />
            {ch.employeeTag}
          </span>
        </div>
        {tabs && (
          <div className="chtabs" aria-hidden="true">
            {tabs.items.map((item, i) => (i === tabs.active ? <b key={item}>{item}</b> : <span key={item}>{item}</span>))}
          </div>
        )}
        <div className="chat" ref={chatRef}>
          {state.chat.length === 0 ? (
            <div className="empty">
              <PlatformLogo channel={channel} size={36} />
              <strong>Start a conversation</strong>
              {scenario.employee.name} messages Sydkyk the same way they’d message a coworker.
            </div>
          ) : (
            state.chat.map(renderMessage)
          )}
          {state.stage === "thinking" && (
            <div className="msg">
              <BotAvatar />
              <div className="body">
                <div className="bubble typing" aria-label="Sydkyk is typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="composer">
          {state.stage === "idle" ? (
            <button className="suggest" type="button" onClick={onSend}>
              <span>Send</span>
              {scenario.prompt}
            </button>
          ) : (
            <div className="inputrow">
              <input type="text" id="composer-input" disabled placeholder="Message Sydkyk" aria-label="Message Sydkyk" />
              <button className="btn line" type="button" disabled>
                Send
              </button>
            </div>
          )}
        </div>
        <TabBar items={["Chat", "Requests", "Leave", "Me"]} />
      </div>
    </section>
  );
}
