"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registerLead, type RegisterState } from "@/app/register/actions";
import { BAND_LABEL, EMPLOYEE_BANDS, FIELD_ORDER, INTERESTS, isPersonalEmail } from "@/lib/leads/schema";

interface Props {
  idempotencyKey: string;
  scenario: string | null;
  testMode: boolean;
  notice: string;
  policyUrl: string | null;
}

const initial: RegisterState = { status: "idle" };

export function RegisterForm({ idempotencyKey, scenario, testMode, notice, policyUrl }: Props) {
  const [state, action, pending] = useActionState(registerLead, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.values ?? {};
  const [email, setEmail] = useState(String(v.email ?? ""));
  const err = state.errors ?? {};

  // After a failed submit, move focus to the first invalid field (or the form message).
  useEffect(() => {
    if (state.status !== "error") return;
    const first = FIELD_ORDER.find((f) => state.errors?.[f]);
    const target = first ? formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`) : document.getElementById("form-msg");
    target?.focus();
  }, [state]);

  const describe = (field: keyof typeof err, hint?: string) =>
    [err[field] ? `${field}-err` : null, hint].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={formRef} action={action} className="lead-form" noValidate>
      {testMode && (
        <p className="testbanner" role="note">
          <strong>Test registration, nothing saved.</strong> The form checks your entries and opens the demo, but no details are stored until the
          privacy notice is approved.
        </p>
      )}
      {state.message && (
        <p id="form-msg" className="err formerr" role="alert" tabIndex={-1}>
          {state.message}
        </p>
      )}

      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      {scenario && <input type="hidden" name="scenario" value={scenario} />}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="fields">
        <label className="f full">
          Full name
          <input name="full_name" id="full_name" autoComplete="name" required maxLength={100} defaultValue={String(v.full_name ?? "")} aria-invalid={!!err.full_name} aria-describedby={describe("full_name")} />
          {err.full_name && <span className="err" id="full_name-err">{err.full_name}</span>}
        </label>
        <label className="f full">
          Work email
          <input
            name="email"
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!err.email}
            aria-describedby={describe("email", isPersonalEmail(email) ? "email-hint" : undefined)}
          />
          {err.email && <span className="err" id="email-err">{err.email}</span>}
          {!err.email && isPersonalEmail(email) && (
            <span className="hint" id="email-hint">
              A work email helps us follow up with the right team. A personal address still works.
            </span>
          )}
        </label>
        <label className="f">
          Company
          <input name="company_name" id="company_name" autoComplete="organization" required maxLength={150} defaultValue={String(v.company_name ?? "")} aria-invalid={!!err.company_name} aria-describedby={describe("company_name")} />
          {err.company_name && <span className="err" id="company_name-err">{err.company_name}</span>}
        </label>
        <label className="f">
          Employees
          <select name="employee_count_band" id="employee_count_band" required defaultValue={String(v.employee_count_band ?? "")} aria-invalid={!!err.employee_count_band} aria-describedby={describe("employee_count_band")}>
            <option value="" disabled>
              Choose a range
            </option>
            {EMPLOYEE_BANDS.map((b) => (
              <option key={b} value={b}>
                {BAND_LABEL[b]}
              </option>
            ))}
          </select>
          {err.employee_count_band && <span className="err" id="employee_count_band-err">{err.employee_count_band}</span>}
        </label>
        <label className="f">
          Phone <span className="opt">optional</span>
          <input name="phone_optional" id="phone_optional" type="tel" autoComplete="tel" maxLength={20} placeholder="+63 917 123 4567" defaultValue={String(v.phone_optional ?? "")} aria-invalid={!!err.phone_optional} aria-describedby={describe("phone_optional")} />
          {err.phone_optional && <span className="err" id="phone_optional-err">{err.phone_optional}</span>}
        </label>
        <label className="f">
          Your role <span className="opt">optional</span>
          <input name="role_optional" id="role_optional" autoComplete="organization-title" maxLength={100} placeholder="e.g. HR Director" defaultValue={String(v.role_optional ?? "")} aria-invalid={!!err.role_optional} aria-describedby={describe("role_optional")} />
          {err.role_optional && <span className="err" id="role_optional-err">{err.role_optional}</span>}
        </label>
      </div>

      <fieldset className="interests">
        <legend>
          Most interested in <span className="opt">optional</span>
        </legend>
        {INTERESTS.map((i) => (
          <label key={i} className="check">
            <input type="checkbox" name="interest_categories" value={i} defaultChecked={Array.isArray(v.interest_categories) && v.interest_categories.includes(i)} />
            {i}
          </label>
        ))}
      </fieldset>

      <div className="notice">
        <p>{notice}</p>
        {policyUrl && (
          <p>
            <a href={policyUrl} target="_blank" rel="noreferrer">
              Read the full privacy notice
            </a>
          </p>
        )}
        <label className="check">
          <input type="checkbox" name="marketing_opt_in" defaultChecked={v.marketing_opt_in === true} />
          Send me occasional product news. Optional, and not needed to use the demo.
        </label>
      </div>

      <button className="btn big" type="submit" disabled={pending}>
        {pending ? "Opening the demo…" : "Explore the enterprise demo"}
      </button>
      <p className="meta">Fictional company and simulated actions. You can leave at any time.</p>
    </form>
  );
}
