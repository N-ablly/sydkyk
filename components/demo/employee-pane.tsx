"use client";

import { useEffect, useRef } from "react";
import { CHANNEL_TABS, CHANNELS } from "@/lib/demo/channels";
import { formatClock } from "@/lib/demo/format";
import { PERSONAS } from "@/lib/demo/personas";
import type { SourceId } from "@/lib/demo/sources.generated";
import type { ChannelId, ChatMessage, Scenario, ScenarioState } from "@/lib/demo/types";
import type { Notice } from "@/lib/demo/use-demo";
import { BotAvatar, PushNotice, StatusBar, TabBar } from "./chrome";
import { PlatformLogo } from "./platform-logo";
import { ArtifactCard, RequestCard, SourceChips } from "./request-card";

interface Props {
  scenario: Scenario;
  state: ScenarioState;
  channel: ChannelId;
  notice?: Notice;
  /** Hidden on narrow screens when another panel tab is selected. */
  off?: boolean;
  onSend: () => void;
  onConfirm: () => void;
  onSource: (id: SourceId) => void;
}

export function EmployeePane({ scenario, state, channel, notice, off, onSend, onConfirm, onSource }: Props) {
  const chatRef = useRef<HTMLDivElement>(null);
  const ch = CHANNELS[channel];
  const tabs = CHANNEL_TABS[channel];
  const requester = PERSONAS[scenario.requester];

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.chat.length, state.stage, state.typing, scenario.id, channel]);

  const renderMessage = (m: ChatMessage) => {
    const me = m.from === "employee";
    const speaker = me ? PERSONAS[m.as ?? scenario.requester] : null;
    let inner;
    if (m.kind === "card") {
      inner = <RequestCard card={scenario.card} state={state} hasApprovals={scenario.approvals.length > 0} onConfirm={onConfirm} />;
    } else if (m.kind === "artifact" && scenario.artifact) {
      inner = <ArtifactCard artifact={scenario.artifact} />;
    } else {
      inner = (
        <>
          <div className={m.tone ? `bubble tone-${m.tone}` : "bubble"}>{m.text}</div>
          <SourceChips ids={m.sources} onOpen={onSource} />
        </>
      );
    }
    return (
      <div key={m.id} className={me ? `msg me${m.as ? " other" : ""}` : "msg"}>
        {me ? (
          <div className="av" aria-hidden="true">
            {speaker!.initials}
          </div>
        ) : (
          <BotAvatar />
        )}
        <div className="body">
          <span className="meta">
            <span className="nm">{me ? speaker!.name : "Sydkyk"}</span>
            {!me && (channel === "gchat" || channel === "slack") && <span className="appbadge">App</span>}
            {me && m.as && <span className="aschip">switched persona</span>}
            {channel === "slack" ? " " : " · "}
            {m.time}
          </span>
          {inner}
        </div>
      </div>
    );
  };

  return (
    <section className={`pane ch-${channel}${off ? " tab-off" : ""}`} aria-label="Employee view" id="emp-pane">
      <div className="device">
        <StatusBar time={formatClock(state.clock, "bare")} />
        <PushNotice notice={notice} />
        <div className="pane-head">
          <div className="av" aria-hidden="true">
            {requester.initials}
          </div>
          <div className="who">
            <strong>{requester.name}</strong>
            <span>{requester.role}</span>
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
        <div className="chat" ref={chatRef} aria-live="polite">
          {state.chat.length === 0 ? (
            <div className="empty">
              <PlatformLogo channel={channel} size={36} />
              <strong>Ask Sydkyk</strong>
              {requester.name} asks the same way they’d message a coworker.
            </div>
          ) : (
            state.chat.map(renderMessage)
          )}
          {(state.stage === "thinking" || state.typing) && (
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
