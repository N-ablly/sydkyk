"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { businessDays, php } from "@/lib/demo/format";
import { LEAVE_BALANCES } from "@/lib/demo/scenarios";
import type { LeaveType, RequestValues, ScenarioId } from "@/lib/demo/types";

type SubmitFn = (values: RequestValues) => void;

function CardShell({
  title,
  source,
  error,
  action,
  onSubmit,
  children,
}: {
  title: string;
  source: string;
  error: string;
  action: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form className="card" onSubmit={handle} noValidate>
      <div className="card-h">
        <strong>{title}</strong>
        <span className="src">{source}</span>
      </div>
      <div className="card-b">
        {children}
        {error && <p className="err">{error}</p>}
        <button className="btn" type="submit">
          {action}
        </button>
      </div>
    </form>
  );
}

function LeaveForm({ onSubmit }: { onSubmit: SubmitFn }) {
  const [type, setType] = useState<LeaveType>("Vacation leave");
  const [from, setFrom] = useState("2026-11-24");
  const [to, setTo] = useState("2026-11-26");
  const [note, setNote] = useState("Family trip to Bohol");
  const [error, setError] = useState("");

  const submit = () => {
    const days = businessDays(from, to);
    const balance = LEAVE_BALANCES[type];
    if (!days) return setError("Pick an end date on or after the start date, with at least one weekday.");
    if (days > balance)
      return setError(`You have ${balance} ${type.toLowerCase()} days. Shorten the range to ${balance} weekdays or fewer.`);
    onSubmit({ type, from, to, note: note.trim(), days, balance });
  };

  return (
    <CardShell title="Your leave balances" source="DARWINBOX · AS OF TODAY" error={error} action="Send for approval" onSubmit={submit}>
      <div className="tiles">
        {(Object.entries(LEAVE_BALANCES) as [LeaveType, number][]).map(([name, days]) => (
          <div className="tile" key={name}>
            <b>{days}</b>
            <span>{name.replace(" leave", "")} days</span>
          </div>
        ))}
      </div>
      <div className="fields">
        <label className="f full">
          Leave type
          <select id="lv-type" value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
            {Object.keys(LEAVE_BALANCES).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="f">
          From
          <input type="date" id="lv-from" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="f">
          To
          <input type="date" id="lv-to" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="f full">
          Note to manager
          <input type="text" id="lv-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
    </CardShell>
  );
}

function ExpenseForm({ onSubmit }: { onSubmit: SubmitFn }) {
  const [client, setClient] = useState("Atlas Freight PH");
  const [attendees, setAttendees] = useState("4");
  const [error, setError] = useState("");

  const submit = () => {
    const att = parseInt(attendees, 10);
    if (!client.trim()) return setError("Add the client name. Policy needs it for client entertainment.");
    if (!(att > 0)) return setError("Enter how many people attended.");
    onSubmit({ client: client.trim(), attendees: att, amount: 3500 });
  };

  return (
    <CardShell title="Expense request" source="NETSUITE · DRAFT" error={error} action="Send for approval" onSubmit={submit}>
      <div className="receipt">
        <div className="paper" aria-label="Receipt image">
          KUSINA ROSARIO
          <br />
          Legazpi Vlg, Makati
          <hr />
          Kare-kare 2<br />
          Sinigang 1<br />
          Drinks 4
          <hr />
          TOTAL 3,500.00
          <br />
          13 OCT 2026
        </div>
        <dl className="kv">
          <dt>Merchant</dt>
          <dd>Kusina Rosario</dd>
          <dt>Date</dt>
          <dd>Oct 13, 2026</dd>
          <dt>Amount</dt>
          <dd>{php(3500)}</dd>
          <dt>Category</dt>
          <dd>Client entertainment</dd>
        </dl>
      </div>
      <div className="chips">
        <span className="chip">Under ₱5,000 limit</span>
        <span className="chip">Receipt readable</span>
        <span className="chip info">VAT receipt</span>
      </div>
      <div className="fields">
        <label className="f">
          Client
          <input type="text" id="ex-client" value={client} onChange={(e) => setClient(e.target.value)} />
        </label>
        <label className="f">
          Attendees
          <input type="number" id="ex-att" min={1} value={attendees} onChange={(e) => setAttendees(e.target.value)} />
        </label>
      </div>
    </CardShell>
  );
}

function AccessForm({ onSubmit }: { onSubmit: SubmitFn }) {
  const [permissionSet, setPermissionSet] = useState("Sales User");
  const [duration, setDuration] = useState("Permanent (role-based)");
  const [reason, setReason] = useState("Manage pipeline reports and opportunity hygiene for the APAC sales team.");
  const [error, setError] = useState("");

  const submit = () => {
    if (reason.trim().length < 10) return setError("Add a short business reason. App owners need it to approve.");
    onSubmit({ permissionSet, duration, reason: reason.trim() });
  };

  return (
    <CardShell title="Access request" source="ENTRA ID · ELIGIBLE" error={error} action="Request access" onSubmit={submit}>
      <dl className="kv">
        <dt>Application</dt>
        <dd>Salesforce</dd>
        <dt>Your role</dt>
        <dd>Sales Operations Analyst (since Oct 12)</dd>
        <dt>Licenses free</dt>
        <dd>4 of 50</dd>
      </dl>
      <div className="chips">
        <span className="chip">Role eligible</span>
        <span className="chip warn">Owner approval required</span>
      </div>
      <div className="fields">
        <label className="f">
          Permission set
          <select id="ac-role" value={permissionSet} onChange={(e) => setPermissionSet(e.target.value)}>
            <option>Sales User</option>
            <option>Sales Ops Reporting</option>
            <option>Read only</option>
          </select>
        </label>
        <label className="f">
          Duration
          <select id="ac-dur" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option>Permanent (role-based)</option>
            <option>30 days</option>
            <option>90 days</option>
          </select>
        </label>
        <label className="f full">
          Business reason
          <textarea id="ac-why" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </div>
    </CardShell>
  );
}

const FORMS: Record<ScenarioId, (props: { onSubmit: SubmitFn }) => ReactNode> = {
  leave: LeaveForm,
  expense: ExpenseForm,
  access: AccessForm,
};

export function RequestForm({ scenario, onSubmit }: { scenario: ScenarioId; onSubmit: SubmitFn }) {
  const Form = FORMS[scenario];
  return <Form onSubmit={onSubmit} />;
}
