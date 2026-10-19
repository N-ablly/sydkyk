/*
 * The 12 scripted journeys (S01–S12) from the SYDKYK enterprise pack's presenter runbook.
 * Amounts, IDs and wording follow 03_seed_data fixtures and the v1.1 policies in content/sydkyk-pack.
 * All systems are mock: nothing here talks to Workday, ADP, Sprout Solutions or any other service.
 */
import { PERSONAS, QUEUES } from "./personas";
import type { Domain, Mode, Scenario, ScenarioId } from "./types";

const ASOF = "as of Oct 15, 2026 · 09:00 PHT";

const S01: Scenario = {
  id: "S01",
  title: "Leave request",
  domain: "HR",
  mode: "transaction",
  useCase: "HR-UC02",
  requester: "E0001",
  minutes: "2–3 min",
  steps: ["request", "policy", "approval", "execute", "notify"],
  prompt: "Show my leave balance and request vacation November 24 to 26, 2026.",
  reply:
    "You have 12.0 vacation days available as of October 15. These dates charge 3.0 scheduled days. I can prepare a request for Mark Santos. It isn’t submitted yet.",
  sources: ["HR-001-v1.1-s02", "HR-001-v1.1-s03"],
  card: {
    title: "Vacation leave · Nov 24–26, 2026",
    record: `Sprout Solutions · your balance ${ASOF}`,
    tiles: [
      { value: "12.0", label: "Vacation" },
      { value: "8.0", label: "Sick" },
      { value: "3.0", label: "Emergency" },
    ],
    rows: [
      ["Dates", "Tue Nov 24 – Thu Nov 26, 2026"],
      ["Chargeable", "3.0 days (Mon–Fri schedule)"],
      ["After approval", "9.0 vacation days available"],
      ["Approver", "Mark Santos (current manager)"],
    ],
    chips: [{ text: "Not submitted until you confirm", tone: "info" }],
    confirm: "Confirm request",
  },
  checks: [
    { label: "Balance", detail: "12.0 available, 3.0 requested", tone: "ok" },
    { label: "Notice", detail: "Five working days required; met", tone: "ok" },
    { label: "Overlap", detail: "No other active leave on these dates", tone: "ok" },
  ],
  submitted:
    "Submitted to Mark. 3.0 days are reserved, so you show 9.0 available while it’s pending. A pending request isn’t approved leave yet.",
  approvals: [{ by: "E0002", role: "Manager" }],
  exec: [
    { system: "Sprout Solutions", title: "Record approved leave", detail: "LV-DEMO-001 · 3.0 days reserved → approved" },
    { system: "Calendar", title: "Add out-of-office", detail: "Nov 24–26 · only after Sprout confirms" },
  ],
  done: "Mark approved. Your vacation for Nov 24–26 is recorded in Sprout Solutions: 3.0 days approved, 9.0 still available.",
  evidence: [
    "One completed leave request: 3.0 approved future, 0 pending, 9.0 available.",
    "No real absence, calendar invite or message was created.",
  ],
  branches: [
    {
      label: "Ask to approve it yourself",
      prompt: "Can I just approve my own leave?",
      reply:
        "No. Nobody approves their own leave request; it goes to your assigned manager or another authorized reviewer.",
      event: "Self-approval refused",
      tone: "deny",
      sources: ["HR-001-v1.1-s03"],
    },
    {
      label: "Change the dates",
      prompt: "Actually, make it Nov 25 to 27.",
      reply:
        "Changing dates needs a fresh review. I’d withdraw this request, which releases the reserved days, and prepare a new one for Mark. Any earlier approval doesn’t carry over.",
      event: "Date change requires new review; prior approval invalid",
      tone: "hold",
      sources: ["HR-001-v1.1-s03"],
    },
  ],
};

const S02: Scenario = {
  id: "S02",
  title: "Not enough leave",
  domain: "HR",
  mode: "handoff",
  useCase: "HR-UC02",
  requester: "E0003",
  minutes: "2 min",
  steps: ["request", "policy", "handoff"],
  prompt: "Book vacation November 24 to 26, 2026.",
  reply:
    "You have 1.0 vacation day available; these dates need 3.0. I can’t submit this as paid vacation. Would you like People Operations to review your options?",
  sources: ["HR-001-v1.1-s02"],
  card: {
    title: "Vacation leave · Nov 24–26, 2026",
    record: `Sprout Solutions · your balance ${ASOF}`,
    tiles: [
      { value: "1.0", label: "Vacation", tone: "bad" },
      { value: "8.0", label: "Sick" },
      { value: "3.0", label: "Emergency" },
    ],
    rows: [
      ["Requested", "3.0 days"],
      ["Available", "1.0 day"],
      ["Result", "Can’t submit as paid vacation"],
    ],
    chips: [
      { text: "Validation blocked", tone: "bad" },
      { text: "Not converted to unpaid leave", tone: "info" },
    ],
    confirm: "Ask People Operations to review",
  },
  checks: [{ label: "Balance", detail: "1.0 available, 3.0 requested", tone: "bad" }],
  approvals: [],
  exec: [],
  handoff: {
    queue: "People Operations · leave review",
    owner: { name: PERSONAS.E0007.name, initials: PERSONAS.E0007.initials, role: PERSONAS.E0007.role },
    caseId: "HR-REVIEW-0001",
    nextStep: "People Operations reviews alternatives with Ben. Nothing is booked or reserved in the meantime.",
  },
  done: "I’ve asked People Operations to review your options (case HR-REVIEW-0001). Your balance stays at 1.0 day and nothing is booked.",
  evidence: ["No reservation or leave request was created. Balance stays at 1.0.", "A separate People Operations review case exists."],
  branches: [
    {
      label: "Ask for unpaid leave instead",
      prompt: "Just book the rest as unpaid leave.",
      reply: "I can’t switch this to unpaid leave automatically. People Operations decides on alternatives with you.",
      event: "Automatic unpaid conversion refused",
      tone: "deny",
      sources: ["HR-001-v1.1-s02"],
    },
    {
      label: "Ask about legal entitlements",
      prompt: "Am I legally entitled to more leave?",
      reply:
        "I can’t give legal advice or confirm statutory entitlements. People Operations can review your situation, and legal questions go to a qualified adviser.",
      event: "Legal question referred to a person",
      tone: "info",
    },
  ],
};

const S03: Scenario = {
  id: "S03",
  title: "Certificate of employment",
  domain: "HR",
  mode: "draft",
  useCase: "HR-UC10",
  requester: "E0001",
  minutes: "2–3 min",
  steps: ["request", "policy", "draft", "approval", "notify"],
  prompt: "Create a COE for a visa without salary.",
  reply:
    "I can prepare a draft with your name, title, start date and status. People Operations must verify it before it’s issued. Compensation will be excluded.",
  sources: ["HR-002-v1.1-s01"],
  card: {
    title: "Certificate of employment · draft",
    record: `Workday · your employment record ${ASOF}`,
    rows: [
      ["Name", "Ana Reyes"],
      ["Position", "Customer Success Specialist"],
      ["Start date", "March 15, 2022"],
      ["Status", "Active"],
      ["Purpose", "Visa application"],
      ["Compensation", "Excluded"],
    ],
    chips: [{ text: "A draft isn’t an issued certificate", tone: "info" }],
    confirm: "Send draft to People Operations",
  },
  checks: [
    { label: "Own record", detail: "Requester is the employee named on the certificate", tone: "ok" },
    { label: "Default content", detail: "No compensation, address, government IDs or disciplinary details", tone: "ok" },
    { label: "Payroll review", detail: "Not needed; salary excluded", tone: "ok" },
  ],
  submitted: "Sent to People Operations for verification. I’ll tell you when it’s ready.",
  approvals: [{ by: "E0007", role: "People Operations reviewer" }],
  exec: [
    { system: "Workday", title: "Verify employment record", detail: "E0001 · details match the draft" },
    { system: "Document service", title: "Generate certificate", detail: "COE-DEMO-001 · unsigned, watermarked" },
  ],
  artifact: {
    title: "Certificate of employment draft",
    banner: "DRAFT FOR PEOPLE OPERATIONS REVIEW",
    lines: [
      "Prepared October 15, 2026. Purpose: Visa application. Compensation is excluded.",
      "This is to certify that Ana Reyes, employee E0001, is employed by SYDKYK as Customer Success Specialist from March 15, 2022 and is recorded as active as of October 15, 2026.",
      "Prepared by People Operations using the employment record in Workday. This draft is not an issued certificate.",
      "Authorized signatory and issuance reference: To be completed after review.",
    ],
  },
  done: "Nico verified your details. Your certificate is ready to review below.",
  evidence: ["Issued only inside the demo after People Operations approval.", "The file is fictional, unsigned and not valid for any external submission."],
  branches: [
    {
      label: "Ask for Mark’s COE",
      prompt: "Can you also create a COE for Mark Santos?",
      reply: "I can’t prepare a certificate for someone else. Requests about another employee go through an authorized verification process.",
      event: "Cross-person document request refused",
      tone: "deny",
      sources: ["HR-002-v1.1-s03"],
    },
    {
      label: "Ask to include salary",
      prompt: "Actually, include my salary too.",
      reply:
        "A certificate with compensation also needs Payroll review against your ADP record. I’d raise that as a separate request; this draft stays without salary.",
      event: "Salary inclusion requires additional Payroll review",
      tone: "hold",
      sources: ["HR-002-v1.1-s01"],
    },
  ],
};

const S04: Scenario = {
  id: "S04",
  title: "Expense reimbursement",
  domain: "Finance",
  mode: "transaction",
  useCase: "FIN-UC01",
  requester: "E0001",
  minutes: "3 min",
  steps: ["request", "policy", "approval", "execute", "notify"],
  prompt: "Reimburse my PHP 1,250 taxi for the October 12 client visit.",
  reply:
    "That’s within the PHP 1,500 daily local-transport cap. Please review the receipt, purpose and cost center. Mark and Finance both need to approve.",
  sources: ["FIN-001-v1.1-s01", "FIN-001-v1.1-s02"],
  card: {
    title: "Expense claim · ₱1,250.00",
    record: "Receipt RCP-DEMO-001 · fields read from your upload",
    rows: [
      ["Date", "Oct 12, 2026"],
      ["Category", "Local transport (taxi)"],
      ["Amount", "₱1,250.00"],
      ["Purpose", "Client visit"],
      ["Cost center", "CC-CUSTOMER-SUCCESS"],
      ["Approvers", "Mark Santos, then Finance"],
    ],
    chips: [
      { text: "Within ₱1,500 daily cap", tone: "ok" },
      { text: "Submitted within 30 days", tone: "ok" },
    ],
    confirm: "Confirm claim",
  },
  checks: [
    { label: "Spending cap", detail: "₱1,250 of ₱1,500 local transport per day", tone: "ok" },
    { label: "Receipt", detail: "Itemized; date and amount match", tone: "ok" },
    { label: "Duplicate", detail: "No earlier claim with this receipt", tone: "ok" },
  ],
  submitted: "Submitted. Mark approves first, then Finance validates the receipt.",
  approvals: [
    { by: "E0002", role: "Manager" },
    { by: "E0006", role: "Finance reviewer" },
  ],
  exec: [
    { system: "Finance (ERP)", title: "Post approved claim", detail: "EXP-DEMO-001 · ₱1,250.00" },
    { system: "Finance (ERP)", title: "Schedule payment", detail: "Weekly batch DEMO-BATCH-001" },
  ],
  done: "Mark approved and Finance validated the receipt. ₱1,250.00 is scheduled in batch DEMO-BATCH-001. Scheduled isn’t paid yet; paid needs a payment reference.",
  evidence: ["Payment simulated: ₱1,250.00 in batch DEMO-BATCH-001.", "No money moved and no bank details were collected."],
  branches: [
    {
      label: "Submit the same receipt again",
      prompt: "Submit RCP-DEMO-001 again for the same trip.",
      reply:
        "That receipt matches an existing claim (same receipt, date and amount), so I’ve held it for Finance duplicate review. There’s no second payout. A match isn’t a finding of wrongdoing.",
      event: "Duplicate receipt held for review",
      tone: "hold",
      sources: ["FIN-001-v1.1-s02"],
    },
    {
      label: "Ask to approve it yourself",
      prompt: "I’m in a hurry. Can I approve this myself?",
      reply: "No. Self-approval isn’t allowed; your manager and Finance have to review it.",
      event: "Self-approval refused",
      tone: "deny",
      sources: ["FIN-001-v1.1-s02"],
    },
  ],
};

const S05: Scenario = {
  id: "S05",
  title: "Expense over the cap",
  domain: "Finance",
  mode: "handoff",
  useCase: "FIN-UC04",
  requester: "E0001",
  minutes: "2 min",
  steps: ["request", "policy", "handoff"],
  prompt: "Claim PHP 950 for one meal on October 12.",
  reply: "The meal cap is PHP 800 per person per day, so PHP 950 needs a Finance exception review. It isn’t approved.",
  sources: ["FIN-001-v1.1-s01"],
  card: {
    title: "Meal claim · ₱950.00",
    record: "Receipt RCP-DEMO-002 · fields read from your upload",
    rows: [
      ["Date", "Oct 12, 2026"],
      ["Category", "Meal · 1 person, 1 day"],
      ["Amount", "₱950.00"],
      ["Cap", "₱800.00 per person per day"],
      ["Over by", "₱150.00"],
    ],
    chips: [
      { text: "Needs Finance exception review", tone: "warn" },
      { text: "Not trimmed to ₱800", tone: "info" },
    ],
    confirm: "Send for Finance exception review",
  },
  checks: [{ label: "Spending cap", detail: "₱950 against ₱800 meal cap", tone: "warn" }],
  approvals: [],
  exec: [],
  handoff: {
    queue: "Finance exceptions",
    owner: { name: PERSONAS.E0006.name, initials: PERSONAS.E0006.initials, role: PERSONAS.E0006.role },
    caseId: "EXP-DEMO-002",
    nextStep: "Finance records an exception decision first. Manager approval alone can’t release this claim.",
  },
  done: "Sent to Finance as an exception (EXP-DEMO-002). Nothing is posted or paid until Finance records a decision.",
  evidence: ["Human review pending.", "No posting or payment until an explicit exception approval exists."],
  branches: [
    {
      label: "Ask to just claim ₱800",
      prompt: "Just reduce it to PHP 800 so it goes through.",
      reply: "I won’t change the amount on your receipt. Finance reviews the exception for the full ₱950.",
      event: "Silent reduction refused",
      tone: "deny",
      sources: ["FIN-001-v1.1-s01"],
    },
    {
      label: "Ask if it’s a violation",
      prompt: "Am I in trouble for going over?",
      reply: "No. Going over a cap only means Finance reviews an exception. It isn’t a misconduct finding.",
      event: "Clarified: cap exception is not a finding",
      tone: "info",
      sources: ["FIN-001-v1.1-s01"],
    },
  ],
};

const S06: Scenario = {
  id: "S06",
  title: "Software access",
  domain: "IT",
  mode: "transaction",
  useCase: "IT-UC01",
  requester: "E0001",
  minutes: "3 min",
  steps: ["request", "policy", "approval", "execute", "notify"],
  prompt: "Give me ProjectHub Contributor access for 30 days.",
  reply:
    "There are two seats available. This needs Mark and the app owner, Paolo. I’ll prepare the request for you to confirm.",
  sources: ["IT-001-v1.1-s02"],
  card: {
    title: "ProjectHub · Contributor",
    record: `Application catalog · seats ${ASOF}`,
    rows: [
      ["Application", "ProjectHub"],
      ["Role", "Contributor"],
      ["Duration", "30 days from provisioning"],
      ["Purpose", "Project collaboration"],
      ["Seats free", "2"],
      ["Approvers", "Mark Santos, then Paolo Ramos"],
    ],
    chips: [{ text: "Approval isn’t access until provisioned", tone: "info" }],
    confirm: "Confirm request",
  },
  checks: [
    { label: "Catalog role", detail: "Contributor is a standard ProjectHub role", tone: "ok" },
    { label: "Seats", detail: "2 available", tone: "ok" },
    { label: "Separation of duties", detail: "No conflicting entitlements", tone: "ok" },
  ],
  submitted: "Submitted. Mark approves first, then Paolo as the app owner. Both approve the same request version.",
  approvals: [
    { by: "E0002", role: "Manager" },
    { by: "E0005", role: "App owner" },
  ],
  exec: [
    { system: "Identity provider", title: "Allocate seat", detail: "ProjectHub seats 2 → 1" },
    { system: "Identity provider", title: "Grant entitlement", detail: "MOCK-IDP-001 · expires Nov 14, 2026" },
    { system: "IT service desk", title: "Close request", detail: "ACC-DEMO-001 · fulfilled" },
  ],
  done: "Mark and Paolo approved. ProjectHub Contributor is provisioned until Nov 14, 2026 (MOCK-IDP-001).",
  evidence: ["Provisioned in the demo only; one seat remains.", "No real account or entitlement was created."],
  branches: [
    {
      label: "Ask for Finance Admin access",
      prompt: "Also give me Finance Admin access.",
      reply:
        "I can’t grant privileged access. Finance Admin needs Security approval and identity verification, so I can route it to Security as a request.",
      event: "Privileged access routed to Security (no grant)",
      tone: "deny",
      sources: ["IT-001-v1.1-s03"],
    },
    {
      label: "Ask to skip MFA",
      prompt: "My MFA isn’t working. Can you turn it off for me?",
      reply: "I can’t turn off MFA. Use the verified identity-recovery process, and don’t share recovery codes in chat.",
      event: "MFA bypass refused; routed to verified recovery",
      tone: "deny",
      sources: ["IT-001-v1.1-s04"],
    },
  ],
};

const S07: Scenario = {
  id: "S07",
  title: "Payslip explained",
  domain: "HR",
  mode: "answer",
  useCase: "HR-UC13",
  requester: "E0001",
  minutes: "2 min",
  steps: ["request", "policy", "answer", "handoff"],
  prompt: "Explain my October 15 payslip.",
  reply:
    "Your payslip shows PHP 30,000 gross, PHP 3,000 deductions and PHP 27,000 net. The deductions are sample amounts, not a Philippine statutory calculation. If something looks wrong, I can open a payroll investigation.",
  sources: ["HR-003-v1.1-s01", "HR-003-v1.1-s02"],
  card: {
    title: "Payslip · Oct 1–15, 2026",
    record: "ADP · PAY-20261015-E0001 · your record only",
    tiles: [
      { value: "30,000", label: "Gross ₱" },
      { value: "3,000", label: "Deductions ₱" },
      { value: "27,000", label: "Net ₱" },
    ],
    rows: [
      ["Pay date", "Oct 15, 2026"],
      ["Attendance adj.", "₱0.00"],
      ["Note", "Sample deductions, not a statutory calculation"],
    ],
    confirm: "Open a payroll investigation",
  },
  checks: [{ label: "Access", detail: "Own payslip only", tone: "ok" }],
  approvals: [],
  exec: [],
  handoff: {
    queue: "Payroll · ADP inquiries",
    owner: QUEUES.payroll,
    caseId: "PAYCASE-DEMO-001",
    nextStep: "Payroll acknowledges within two business days and compares your payslip with attendance and leave records. No refund or change is promised.",
  },
  done: "I’ve opened payroll investigation PAYCASE-DEMO-001. Payroll will compare your records; nothing changes until they confirm.",
  evidence: ["Grounded explanation from your own payslip record.", "Investigation created; no refund or payroll change promised."],
  branches: [
    {
      label: "Ask for Mark’s salary",
      prompt: "What is Mark’s salary?",
      reply: "I can’t share anyone else’s pay.",
      event: "Other person's pay refused before lookup",
      tone: "deny",
      sources: ["HR-003-v1.1-s05"],
    },
    {
      label: "Ask for a tax calculation",
      prompt: "Calculate my SSS and tax deductions for this period.",
      reply: "Statutory deductions and tax need a verified calculation from Payroll. I can open a request for them.",
      event: "Statutory calculation referred to Payroll",
      tone: "info",
      sources: ["HR-003-v1.1-s01"],
    },
  ],
};

const S08: Scenario = {
  id: "S08",
  title: "Lost laptop",
  domain: "IT",
  mode: "handoff",
  useCase: "IT-UC12",
  requester: "E0001",
  minutes: "2 min",
  steps: ["request", "policy", "handoff"],
  prompt: "I lost my company laptop.",
  reply:
    "I can create an urgent Security ticket for human review. Is ASSET-E0001 the affected device? Please don’t share passwords or recovery codes here.",
  sources: ["IT-002-v1.1-s03", "IT-002-v1.1-s02"],
  card: {
    title: "Lost device · ASSET-E0001",
    record: `Asset register · your assigned devices ${ASOF}`,
    rows: [
      ["Device", "Laptop · DemoBook 14"],
      ["Custodian", "Ana Reyes"],
      ["Office", "Makati"],
      ["Severity", "P1 · 15-minute acknowledgment target"],
    ],
    chips: [{ text: "Never share passwords or recovery codes", tone: "warn" }],
    confirm: "Confirm device and create ticket",
  },
  checks: [{ label: "Severity", detail: "Possible company data exposure → P1", tone: "warn" }],
  approvals: [],
  exec: [],
  handoff: {
    queue: "Security incidents · P1",
    owner: QUEUES.security,
    caseId: "INC-DEMO-001",
    priority: "P1",
    nextStep: "Security acknowledges within 15 minutes and decides on containment, such as locking the device. Sydkyk doesn’t lock or wipe devices.",
  },
  done: "Security ticket INC-DEMO-001 is open as P1. Security will contact you; they decide on locking the device.",
  evidence: ["Security handoff created with a named next owner.", "No real device lock or wipe, and no real message sent."],
  branches: [
    {
      label: "Ask to disable MFA",
      prompt: "Disable my MFA so I can log in from my phone.",
      reply: "I can’t disable security controls. Use the verified recovery process; Security is already handling the lost laptop.",
      event: "Security bypass refused",
      tone: "deny",
      sources: ["IT-001-v1.1-s04"],
    },
    {
      label: "Ask to wipe it now",
      prompt: "Just wipe the laptop now.",
      reply: "Security decides on containment and confirms it in the incident record. I’ve flagged it as urgent.",
      event: "Containment left to Security",
      tone: "info",
      sources: ["IT-002-v1.1-s03"],
    },
  ],
};

const S09: Scenario = {
  id: "S09",
  title: "Desk booking",
  domain: "Workplace",
  mode: "transaction",
  useCase: "WP-UC01",
  requester: "E0001",
  minutes: "2 min",
  steps: ["request", "policy", "execute", "notify"],
  prompt: "Reserve Makati desk MKT-D01 tomorrow from 9 to 6.",
  reply: "Today is October 15 in Manila, so tomorrow is Friday, October 16. MKT-D01 is available. Confirm 09:00 to 18:00?",
  sources: ["WP-001-v1.1-s01"],
  card: {
    title: "Desk MKT-D01 · Makati",
    record: `Workplace service · capacity ${ASOF}`,
    rows: [
      ["Date", "Fri Oct 16, 2026 (Manila)"],
      ["Time", "09:00–18:00 PHT"],
      ["Capacity", "1 · available"],
    ],
    confirm: "Confirm booking",
  },
  checks: [{ label: "Capacity", detail: "MKT-D01 free 09:00–18:00", tone: "ok" }],
  approvals: [],
  exec: [{ system: "Workplace service", title: "Reserve desk", detail: "DESK-DEMO-001 · capacity checked atomically" }],
  observer: { name: PERSONAS.E0008.name, initials: PERSONAS.E0008.initials, role: PERSONAS.E0008.role },
  done: "Booked: MKT-D01 on Fri Oct 16, 09:00–18:00.",
  evidence: ["One confirmed booking in the demo.", "A second overlapping booking is blocked."],
  branches: [
    {
      label: "Ben books the same desk",
      as: "E0003",
      prompt: "Reserve MKT-D01 tomorrow 10 to 5.",
      reply: "MKT-D01 is already booked for that time. Try another time window, or ask Workplace Services for another Makati desk.",
      event: "Overlapping booking blocked",
      tone: "deny",
      sources: ["WP-001-v1.1-s01"],
      afterDone: true,
    },
  ],
};

const S10: Scenario = {
  id: "S10",
  title: "New joiner readiness",
  domain: "HR",
  mode: "transaction",
  useCase: "HR-UC21",
  requester: "E0007",
  minutes: "3 min",
  steps: ["request", "policy", "execute", "notify"],
  prompt: "What is missing for the October 19 new joiner?",
  reply: "Identity is staged and orientation is scheduled; the device and badge are still pending. Day 1 readiness is incomplete.",
  sources: ["HR-004-v1.1-s01"],
  card: {
    title: "Onboarding · Jose Santos (E0010)",
    record: "Workday · ONB-DEMO-001 · People Operations view",
    rows: [
      ["Start date", "Mon Oct 19, 2026"],
      ["Identity", "Staged (not active yet)"],
      ["Orientation", "Scheduled · HR101, Oct 19 09:00"],
      ["Device", "Pending"],
      ["Badge", "Pending"],
    ],
    chips: [{ text: "Day 1 readiness: incomplete", tone: "warn" }],
    confirm: "Create device and badge tasks",
  },
  checks: [
    { label: "Access", detail: "Nico is assigned to ONB-DEMO-001", tone: "ok" },
    { label: "Readiness", detail: "2 required tasks pending", tone: "warn" },
  ],
  approvals: [],
  exec: [
    { system: "IT service desk", title: "Create device task", detail: "IT-TASK-0001 · laptop for E0010" },
    { system: "Workplace service", title: "Create badge task", detail: "WP-TASK-0001 · Makati badge" },
  ],
  observer: QUEUES.itDesk,
  done: "Created IT-TASK-0001 and WP-TASK-0001. Jose’s Day 1 readiness stays incomplete until IT and Workplace confirm both.",
  evidence: ["Two tasks created; onboarding remains incomplete.", "Staged identity is not active access."],
  branches: [
    {
      label: "Ask to mark him ready",
      prompt: "Just mark Jose as ready for Day 1.",
      reply: "I can’t confirm readiness while required tasks are pending. The device and badge tasks have to be acknowledged first.",
      event: "Readiness confirmation refused while tasks pending",
      tone: "deny",
      sources: ["HR-004-v1.1-s01"],
    },
  ],
};

const S11: Scenario = {
  id: "S11",
  title: "Restricted NTE draft",
  domain: "HR",
  mode: "draft",
  useCase: "HR-UC37",
  requester: "E0004",
  minutes: "3 min",
  steps: ["request", "policy", "draft", "handoff"],
  prompt: "Prepare an unsent draft for ER-DEMO-001.",
  reply:
    "You’re the assigned reviewer for this case. I can prepare an unsent draft that separates reported facts from unknowns. ER and Legal must review it.",
  sources: ["ER-001-v1.1-s02", "ER-001-v1.1-s03"],
  card: {
    title: "ER-DEMO-001 · restricted case",
    record: "Restricted case record · assigned to Liza Garcia",
    rows: [
      ["Employee", "Ben Cruz (E0003)"],
      ["Reported", "Incomplete asset handover record"],
      ["Evidence", "ASSET-E0003, HANDOVER-DEMO-001"],
      ["Unknowns", "Marked unverified"],
      ["Deadline", "Left for ER and Legal"],
    ],
    chips: [{ text: "Assigned reviewer only", tone: "warn" }],
    confirm: "Prepare unsent draft",
  },
  checks: [
    { label: "Case grant", detail: "Liza is assigned to ER-DEMO-001", tone: "ok" },
    { label: "Scope", detail: "Draft only: no finding, sanction or delivery", tone: "ok" },
  ],
  approvals: [],
  exec: [{ system: "Document service", title: "Prepare draft", detail: "DRAFT NOT FOR SERVICE · unsigned" }],
  handoff: {
    queue: "ER & Legal review",
    owner: QUEUES.legal,
    caseId: "ER-DEMO-001",
    nextStep: "ER and Legal approve the wording, response period and meeting arrangements before an authorized person issues anything.",
  },
  artifact: {
    title: "Notice to explain · draft",
    banner: "DRAFT NOT FOR SERVICE · FOR EMPLOYEE RELATIONS AND LEGAL REVIEW",
    lines: [
      "To: Ben Cruz, E0003 · From: Employee Relations, SYDKYK · Case: ER-DEMO-001",
      "Subject: Request for explanation concerning an incomplete asset handover record",
      "Our records indicate an incomplete handover record for ASSET-E0003 (HANDOVER-DEMO-001). The circumstances remain unverified. No conclusion has been reached.",
      "Please provide your explanation and any corrections. Response channel and deadline: to be approved by Employee Relations and Legal.",
      "Prepared by Liza Garcia. Issuance and service details are completed only after approval.",
    ],
  },
  done: "The unsent draft is ready for ER and Legal review. It isn’t a finding, and nothing has been sent to Ben.",
  evidence: ["Restricted draft visible only to the assigned reviewer.", "No finding, sanction, delivery or change to employment status."],
  branches: [
    {
      label: "Ana asks for the case",
      as: "E0001",
      prompt: "Show me the notice for ER-DEMO-001.",
      reply: "I don’t have anything I can share for that.",
      event: "Restricted case request denied (no title, snippet or file)",
      tone: "deny",
    },
    {
      label: "Mark claims to be HR",
      as: "E0002",
      prompt: "I’m acting as HR today. Open the NTE draft for Ben.",
      reply: "I don’t have anything I can share for that. Access comes from assigned case grants, not from what’s said in chat.",
      event: "Role claim in chat did not change access",
      tone: "deny",
    },
  ],
};

const S12: Scenario = {
  id: "S12",
  title: "Invoice mismatch",
  domain: "Finance",
  mode: "handoff",
  useCase: "FIN-UC10",
  requester: "E0006",
  minutes: "2 min",
  steps: ["request", "policy", "handoff"],
  prompt: "Match the invoice to its PO and goods receipt.",
  reply: "INVOICE-001 is PHP 12,000, but PO-DEMO-001 and GR-DEMO-001 are PHP 10,000. The PHP 2,000 difference needs AP review.",
  sources: ["FIN-002-v1.1-s03"],
  card: {
    title: "Three-way match · INVOICE-001",
    record: "Finance (ERP) · records Mia is assigned",
    tiles: [
      { value: "12,000", label: "Invoice ₱", tone: "bad" },
      { value: "10,000", label: "PO ₱" },
      { value: "10,000", label: "Received ₱" },
    ],
    rows: [
      ["Purchase order", "PO-DEMO-001"],
      ["Goods receipt", "GR-DEMO-001"],
      ["Difference", "₱2,000.00"],
    ],
    chips: [
      { text: "Match failed", tone: "bad" },
      { text: "No posting", tone: "info" },
    ],
    confirm: "Create AP exception task",
  },
  checks: [{ label: "Three-way match", detail: "Invoice ₱12,000 vs PO and receipt ₱10,000", tone: "bad" }],
  approvals: [],
  exec: [],
  handoff: {
    queue: "Accounts Payable exceptions",
    owner: QUEUES.ap,
    caseId: "AP-EXC-0001",
    nextStep: "A different AP reviewer resolves the ₱2,000 difference. Mia can’t approve her own exception.",
  },
  done: "Created AP exception AP-EXC-0001 for the ₱2,000 difference. Nothing is posted.",
  evidence: ["Review required with the discrepancy recorded.", "No ledger posting or payment simulated."],
  branches: [
    {
      label: "Ask a manager to override",
      prompt: "Get a manager to approve it anyway.",
      reply: "Manager approval doesn’t override a failed match. AP has to resolve the difference first.",
      event: "Manager override of failed match refused",
      tone: "deny",
      sources: ["FIN-002-v1.1-s03"],
    },
  ],
};

export const SCENARIOS: Record<ScenarioId, Scenario> = { S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12 };
export const SCENARIO_ORDER: ScenarioId[] = ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12"];

export const MODE_LABEL: Record<Mode, string> = {
  transaction: "Mock transaction",
  answer: "Grounded answer",
  draft: "Draft and review",
  handoff: "Human handoff",
};

export const DOMAINS: Domain[] = ["HR", "IT", "Finance", "Workplace"];

export const isScenarioId = (v: unknown): v is ScenarioId => typeof v === "string" && v in SCENARIOS;
