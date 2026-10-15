import { formatDate, php } from "./format";
import type {
  AccessValues,
  ExpenseValues,
  LeaveType,
  LeaveValues,
  Person,
  Scenario,
  ScenarioId,
} from "./types";

const ana: Person = { name: "Ana Reyes", initials: "AR", role: "Customer Success · Makati" };
const mark: Person = { name: "Mark Santos", initials: "MS", role: "Manager, Customer Success" };

export const LEAVE_BALANCES: Record<LeaveType, number> = {
  "Vacation leave": 12,
  "Sick leave": 8,
  "Emergency leave": 3,
};

const leave: Scenario<LeaveValues> = {
  id: "leave",
  label: "Leave request",
  employee: ana,
  approver: mark,
  prompt: "Show me my leave balances. I want to take vacation leave Nov 24 to 26.",
  intent: "Leave balance + vacation leave request",
  reply:
    "Here are your balances from Darwinbox. I filled in a vacation request for Nov 24–26. Check the dates and send it to Mark when you’re ready.",
  readEvent: "Read leave balances from Darwinbox (read-only, own record)",
  systems: ["Darwinbox HRIS", "Outlook calendar"],
  systemOfRecord: "Darwinbox",
  declineDraft: "Quarter-end client renewals that week. Can you move it to the week after?",
  startClock: 9 * 3600 + 41 * 60,
  title: (v) => `${v.type} · ${v.days} day${v.days > 1 ? "s" : ""}`,
  details: (v) => [
    ["Employee", ana.name],
    ["Dates", `${formatDate(v.from)} – ${formatDate(v.to)}`],
    ["Working days", String(v.days)],
    ["Balance after", `${v.balance - v.days} of ${v.balance} days`],
    ["Note", v.note || "—"],
  ],
  checks: (v) => [
    ["Enough balance", `${v.balance} days available, ${v.days} requested`],
    ["Notice period met", "Policy needs 5 business days; this request gives 28"],
    ["Team coverage", "1 of 6 teammates already off on these dates (limit is 2)"],
  ],
  exec: (v) => [
    ["Create leave record in Darwinbox", `LV-2026-0871 · ${v.type}`],
    ["Deduct balance", `${v.balance} → ${v.balance - v.days} days`],
    ["Block Ana’s Outlook calendar", `${formatDate(v.from)} – ${formatDate(v.to)} · Out of office`],
    ["Tell the team channel", "#cs-makati · coverage note posted"],
  ],
  done: (v) =>
    `Approved by Mark. Your ${v.type.toLowerCase()} for ${formatDate(v.from)} – ${formatDate(v.to)} is booked, your calendar is blocked, and you have ${v.balance - v.days} days left. Enjoy the trip!`,
};

const expense: Scenario<ExpenseValues> = {
  id: "expense",
  label: "Reimbursement",
  employee: ana,
  approver: mark,
  prompt: "Reimburse my ₱3,500 Makati client dinner from last night. Receipt attached.",
  intent: "Expense reimbursement",
  reply:
    "I read your receipt and matched it to the client entertainment policy. Add the client name and I’ll send it to Mark.",
  readEvent: "Extracted receipt fields (OCR) · matched NetSuite expense policy",
  systems: ["Receipt OCR", "NetSuite"],
  systemOfRecord: "NetSuite",
  declineDraft: "Please split this between the two client accounts first.",
  startClock: 10 * 3600 + 6 * 60,
  title: (v) => `Client dinner · ${php(v.amount)}`,
  details: (v) => [
    ["Employee", ana.name],
    ["Merchant", "Kusina Rosario, Makati"],
    ["Client", v.client],
    ["Attendees", `${v.attendees} (${php(Math.round(v.amount / v.attendees))} per person)`],
    ["Cost center", "CS-PH-210"],
  ],
  checks: (v) => [
    ["Within limit", `${php(v.amount)} of ${php(5000)} per client event`],
    ["Receipt valid", "Official receipt with TIN, dated within 30 days"],
    ["No duplicate", "No matching amount and merchant in the last 90 days"],
  ],
  exec: () => [
    ["Create expense report in NetSuite", "ER-2026-1142 · Client entertainment"],
    ["Attach receipt and approval", "Approval by Mark Santos linked"],
    ["Queue for reimbursement", "Oct 30 payroll batch · no payment made in this demo"],
    ["Update budget tracker", "CS-PH-210 · Q4 entertainment budget"],
  ],
  done: (v) =>
    `Approved by Mark. Expense report ER-2026-1142 for ${php(v.amount)} (${v.client}) is filed in NetSuite. It’s queued for the Oct 30 payroll batch.`,
};

const jomar: Person = { name: "Jomar Cruz", initials: "JC", role: "Sales Operations · BGC" };
const liza: Person = { name: "Liza Tan", initials: "LT", role: "Salesforce app owner, IT" };

const access: Scenario<AccessValues> = {
  id: "access",
  label: "IT access",
  employee: jomar,
  approver: liza,
  prompt: "I moved to Sales Ops this week. I need access to Salesforce for my new role.",
  intent: "Application access request",
  reply:
    "Your new role is eligible for a Salesforce Sales User license. I filled in the request. Liza Tan owns Salesforce, so she approves it.",
  readEvent: "Checked role eligibility in Entra ID + license pool in Salesforce",
  systems: ["Entra ID", "Salesforce", "ServiceNow"],
  systemOfRecord: "Entra ID or Salesforce",
  declineDraft: "Use the Sales Ops Reporting set instead. Sales User is for quota-carrying reps.",
  startClock: 14 * 3600 + 22 * 60,
  title: (v) => `Salesforce · ${v.permissionSet}`,
  details: (v) => [
    ["Employee", jomar.name],
    ["New role", "Sales Operations Analyst"],
    ["Permission set", v.permissionSet],
    ["Duration", v.duration],
    ["Reason", v.reason],
  ],
  checks: () => [
    ["Role eligible", "Sales Operations → Salesforce access allowed by role policy"],
    ["License available", "4 of 50 Sales User licenses free"],
    ["No conflicts", "No separation-of-duties conflict with finance approver roles"],
  ],
  exec: (v) => [
    ["Add to Entra ID group", "SG-Salesforce-" + v.permissionSet.replace(/\s+/g, "")],
    ["Assign Salesforce license", `${v.permissionSet} · 3 of 50 now free`],
    ["Close ServiceNow ticket", "RITM0048213 · fulfilled"],
    [
      "Schedule access review",
      v.duration.startsWith("Perm") ? "Quarterly review, Jan 2027" : "Auto-remove when access expires",
    ],
  ],
  done: (v) =>
    `Approved by Liza. You now have Salesforce access (${v.permissionSet}). Sign in with your company account at your Salesforce login page. Ticket RITM0048213 is closed.`,
};

/** Method-style signatures make each typed scenario assignable to Scenario<RequestValues>. */
export const SCENARIOS: Record<ScenarioId, Scenario> = { leave, expense, access };

export const SCENARIO_ORDER: ScenarioId[] = ["leave", "expense", "access"];

export const isScenarioId = (v: unknown): v is ScenarioId =>
  typeof v === "string" && v in SCENARIOS;
