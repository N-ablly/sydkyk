import type { ChannelId } from "./types";

export interface Channel {
  label: string;
  /** Short name used in the systems chain and audit events. */
  name: string;
  /** Completes "Ana asks Sydkyk …". */
  where: string;
  employeeTag: string;
  approverTag: string;
}

export const CHANNELS: Record<ChannelId, Channel> = {
  teams: {
    label: "Microsoft Teams",
    name: "Teams",
    where: "in Teams",
    employeeTag: "Employee · Microsoft Teams",
    approverTag: "Approver console",
  },
  gchat: {
    label: "Google Chat",
    name: "Google Chat",
    where: "in Google Chat",
    employeeTag: "Employee · Google Chat",
    approverTag: "Approver console",
  },
  slack: {
    label: "Slack",
    name: "Slack",
    where: "in Slack",
    employeeTag: "Employee · Slack",
    approverTag: "Approver console",
  },
  mobile: {
    label: "Mobile app",
    name: "Sydkyk app",
    where: "in the Sydkyk mobile app",
    employeeTag: "Sydkyk app",
    approverTag: "Sydkyk app",
  },
};

export const CHANNEL_ORDER: ChannelId[] = ["teams", "gchat", "slack", "mobile"];

/** Tab row under the chat header; only Teams and Slack show one. */
export const CHANNEL_TABS: Partial<Record<ChannelId, { items: string[]; active: number }>> = {
  teams: { items: ["Chat", "Requests", "About"], active: 0 },
  slack: { items: ["Home", "Messages", "About"], active: 1 },
};

export const isChannelId = (v: unknown): v is ChannelId =>
  typeof v === "string" && v in CHANNELS;
