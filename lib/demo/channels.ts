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
  mobile: {
    label: "Mobile app",
    name: "Sydkyk app",
    where: "in the Sydkyk mobile app",
    employeeTag: "Sydkyk app",
    approverTag: "Sydkyk app",
  },
};

export const CHANNEL_ORDER: ChannelId[] = ["teams", "gchat", "mobile"];

export const isChannelId = (v: unknown): v is ChannelId =>
  typeof v === "string" && v in CHANNELS;
