"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isScenarioId } from "@/lib/demo/scenarios";
import { REGISTRATION_REQUIRED, leadStorageEnabled, supabaseConfigured } from "@/lib/leads/config";
import { NOTICE } from "@/lib/leads/notice";
import { FIELD_ORDER, parseLeadForm, type LeadField } from "@/lib/leads/schema";
import { clientFingerprint, writeSession } from "@/lib/leads/session";
import { adminClient } from "@/lib/supabase/admin";

export interface RegisterState {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<LeadField, string>>;
  /** Echoed back so the form keeps what the visitor typed after an error. */
  values?: Record<string, string | string[] | boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RETENTION_MS = NOTICE.retentionDays * 24 * 3600 * 1000;

function echo(form: FormData): RegisterState["values"] {
  return {
    full_name: String(form.get("full_name") ?? ""),
    email: String(form.get("email") ?? ""),
    company_name: String(form.get("company_name") ?? ""),
    employee_count_band: String(form.get("employee_count_band") ?? ""),
    phone_optional: String(form.get("phone_optional") ?? ""),
    role_optional: String(form.get("role_optional") ?? ""),
    interest_categories: form.getAll("interest_categories").map(String),
    marketing_opt_in: form.get("marketing_opt_in") === "on",
  };
}

/** Returns false when this network has made too many attempts. Fails open if the limiter is unavailable. */
async function underRateLimit(): Promise<boolean> {
  if (!supabaseConfigured()) return true;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  const { data, error } = await adminClient().rpc("hit_rate_limit", {
    p_bucket: `signup:${clientFingerprint(ip)}`,
    p_window_seconds: 600,
    p_max: 8,
  });
  if (error) {
    console.error("rate limit unavailable", error.code);
    return true;
  }
  return data === true;
}

export async function registerLead(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  if (!REGISTRATION_REQUIRED) redirect("/demo");
  const values = echo(form);
  const scenario = String(form.get("scenario") ?? "");
  const next = isScenarioId(scenario) ? `/demo?scenario=${scenario}` : "/demo";

  // Honeypot: real visitors never see or fill this field. Open the demo without storing anything.
  if (String(form.get("website") ?? "") !== "") {
    await writeSession({ lid: "test", mode: "test" });
    redirect(next);
  }

  if (!(await underRateLimit())) {
    return { status: "error", values, message: "Too many sign-ups from this network. Wait a few minutes, then try again." };
  }

  const parsed = parseLeadForm(form);
  if (!parsed.success) {
    const errors: Partial<Record<LeadField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as LeadField;
      if (!errors[field]) errors[field] = issue.message;
    }
    const first = FIELD_ORDER.find((f) => errors[f]);
    return { status: "error", values, errors, message: first ? "Check the highlighted fields." : undefined };
  }

  const idempotencyKey = String(form.get("idempotency_key") ?? "");
  if (!UUID.test(idempotencyKey)) {
    return { status: "error", values, message: "The form expired. Reload the page and try again; your entries will need to be re-entered." };
  }

  if (!leadStorageEnabled()) {
    await writeSession({ lid: "test", mode: "test" });
    redirect(next);
  }

  const lead = parsed.data;
  const email = lead.email.toLowerCase();
  const now = new Date();
  const db = adminClient();
  const { data: inserted, error } = await db
    .from("leads")
    .insert({
      full_name: lead.full_name,
      email_normalized: email,
      company_name: lead.company_name,
      employee_count_band: lead.employee_count_band,
      phone_optional: lead.phone_optional,
      role_optional: lead.role_optional,
      interest_categories: lead.interest_categories,
      notice_version: NOTICE.version,
      marketing_opt_in: lead.marketing_opt_in,
      idempotency_key: idempotencyKey,
      source: "experience",
    })
    .select("lead_id")
    .single();

  let leadId = inserted?.lead_id as string | undefined;

  if (error?.code === "23505") {
    // Same email (returning visitor) or a double submit. Refresh the visit without overwriting their
    // details or revealing that the address was already registered.
    const { data: existing, error: touchError } = await db
      .from("leads")
      .update({ last_seen_at: now.toISOString(), expires_at: new Date(now.getTime() + RETENTION_MS).toISOString() })
      .eq("email_normalized", email)
      .eq("source", "experience")
      .select("lead_id")
      .maybeSingle();
    if (touchError) console.error("lead refresh failed", touchError.code);
    leadId = (existing?.lead_id as string | undefined) ?? leadId;
  } else if (error) {
    console.error("lead insert failed", error.code);
    return { status: "error", values, message: "We couldn’t save your details just now. Your entries are still here; please try again." };
  }

  await writeSession({ lid: leadId ?? "returning", mode: "saved" });
  redirect(next);
}
