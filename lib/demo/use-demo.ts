"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isChannelId } from "./channels";
import { PERSONAS } from "./personas";
import { demoReducer, initialDemoState } from "./reducer";
import { SCENARIOS, isScenarioId } from "./scenarios";
import type { ChannelId, ScenarioId } from "./types";

export type NoticeTarget = "employee" | "approver";
export interface Notice {
  title: string;
  body: string;
  visible: boolean;
}

const STORAGE = { scenario: "sydkyk-demo-scenario", channel: "sydkyk-demo-chan" };

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: remembering the scenario is a convenience only.
  }
}

/** Demo state plus timed side effects: typing delay, execution steps and simulated push notifications. */
export function useDemo() {
  const [state, dispatch] = useReducer(demoReducer, undefined, initialDemoState);
  const [notices, setNotices] = useState<Partial<Record<NoticeTarget, Notice>>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(setTimeout(fn, reduce ? Math.min(ms, 150) : ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const hideNotices = useCallback(() => {
    setNotices((n) => ({
      employee: n.employee && { ...n.employee, visible: false },
      approver: n.approver && { ...n.approver, visible: false },
    }));
  }, []);

  const notify = useCallback(
    (target: NoticeTarget, title: string, body: string) => {
      setNotices((n) => ({ ...n, [target]: { title, body, visible: true } }));
      later(() => setNotices((n) => ({ ...n, [target]: n[target] && { ...n[target]!, visible: false } })), 4200);
    },
    [later],
  );

  useEffect(() => clearTimers, [clearTimers]);

  // Restore the last scenario and channel after hydration so server and client markup match.
  useEffect(() => {
    const id = readStorage(STORAGE.scenario);
    const ch = readStorage(STORAGE.channel);
    if (isScenarioId(id)) dispatch({ type: "select", id });
    if (isChannelId(ch)) dispatch({ type: "channel", channel: ch });
  }, []);

  const scenario = SCENARIOS[state.current];
  const current = state.scenarios[state.current];
  const mobile = state.channel === "mobile";

  const runExecution = (onDone?: () => void) => {
    const n = scenario.exec.length;
    for (let i = 1; i <= n; i++) later(() => dispatch({ type: "execStep" }), 700 * i);
    later(() => {
      dispatch({ type: "finish" });
      onDone?.();
    }, 700 * n + 600);
  };

  const doneNotice = () => {
    if (mobile) notify("employee", scenario.handoff && !scenario.exec.length ? "Request routed" : "Request complete", scenario.done.split(". ")[0] + ".");
  };

  const select = (id: ScenarioId) => {
    clearTimers();
    hideNotices();
    dispatch({ type: "select", id });
    writeStorage(STORAGE.scenario, id);
  };

  const setChannel = (channel: ChannelId) => {
    hideNotices();
    dispatch({ type: "channel", channel });
    writeStorage(STORAGE.channel, channel);
  };

  const reset = () => {
    clearTimers();
    hideNotices();
    dispatch({ type: "reset" });
  };

  const send = () => {
    dispatch({ type: "send" });
    later(() => dispatch({ type: "reply" }), 1100);
  };

  const confirm = () => {
    dispatch({ type: "confirm" });
    if (scenario.approvals.length) {
      const first = PERSONAS[scenario.approvals[0].by];
      if (mobile) later(() => notify("approver", `Approval needed · ${first.name.split(" ")[0]}`, scenario.card.title), 500);
    } else if (scenario.exec.length) {
      runExecution(() => {
        doneNotice();
        if (mobile && scenario.handoff) notify("approver", `New case · ${scenario.handoff.caseId}`, scenario.handoff.queue);
      });
    } else {
      doneNotice();
      if (mobile && scenario.handoff) later(() => notify("approver", `New case · ${scenario.handoff!.caseId}`, scenario.handoff!.queue), 400);
    }
  };

  const approve = () => {
    const last = current.approvalIdx >= scenario.approvals.length - 1;
    dispatch({ type: "approve" });
    if (last) runExecution(doneNotice);
    else if (mobile) {
      const next = PERSONAS[scenario.approvals[current.approvalIdx + 1].by];
      later(() => notify("approver", `Approval needed · ${next.name.split(" ")[0]}`, scenario.card.title), 500);
    }
  };

  const reject = (reason: string) => {
    dispatch({ type: "reject", reason });
    if (mobile) notify("employee", "Request rejected", reason);
  };

  const branch = (index: number) => {
    dispatch({ type: "branchAsk", index });
    later(() => dispatch({ type: "branchReply", index }), 900);
  };

  return { state, scenario, current, notices, select, setChannel, reset, send, confirm, approve, reject, branch };
}
