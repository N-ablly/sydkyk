"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isChannelId } from "./channels";
import { demoReducer, initialDemoState } from "./reducer";
import { SCENARIOS, isScenarioId } from "./scenarios";
import type { ChannelId, RequestValues, ScenarioId } from "./types";

export type NoticeTarget = "employee" | "approver";
export interface Notice {
  title: string;
  body: string;
  visible: boolean;
}

const STORAGE = { scenario: "sydkyk-demo-tab", channel: "sydkyk-demo-chan" };

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
    // Private mode or blocked storage: remembering the tab is a convenience only.
  }
}

/** Demo state plus the timed side effects (typing delay, execution steps, push notifications). */
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

  const submit = (values: RequestValues) => {
    dispatch({ type: "submit", values });
    if (mobile) {
      later(() => notify("approver", "Approval needed", `${scenario.employee.name}: ${scenario.title(values)}`), 500);
    }
  };

  const approve = () => {
    if (!current.values) return;
    const values = current.values;
    const steps = scenario.exec(values).length;
    dispatch({ type: "approve" });
    for (let i = 1; i <= steps; i++) later(() => dispatch({ type: "execStep" }), 700 * i);
    later(() => {
      dispatch({ type: "finish" });
      if (mobile) notify("employee", "Request approved", scenario.done(values).split(". ")[0] + ".");
    }, 700 * steps + 600);
  };

  const decline = (reason: string) => {
    dispatch({ type: "decline", reason });
    if (mobile) notify("employee", "Request declined", `${scenario.approver.name.split(" ")[0]}: ${reason}`);
  };

  return { state, scenario, current, notices, select, setChannel, reset, send, submit, approve, decline };
}
