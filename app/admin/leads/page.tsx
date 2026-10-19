import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BAND_LABEL } from "@/lib/leads/schema";
import { leadStorageEnabled, supabaseConfigured } from "@/lib/leads/config";
import type { LeadRow } from "@/lib/leads/csv";
import { adminClient } from "@/lib/supabase/admin";
import { currentAdmin } from "@/lib/supabase/server";
import { signOut } from "../actions";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

async function LeadsTable() {
  // Always render per request: this page depends on the admin's session and live data.
  await connection();
  if (!supabaseConfigured()) redirect("/admin/login");
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const { data, count, error } = await adminClient()
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);
  const leads = (data ?? []) as LeadRow[];

  return (
    <main className="panel wide">
      <div className="admin-h">
        <div>
          <h1 className="ptitle">Leads</h1>
          <p className="meta">
            {count ?? 0} total{(count ?? 0) > 500 ? " · showing the newest 500" : ""} · times in Manila · signed in as {admin}
          </p>
        </div>
        <div className="actions">
          <a className="btn" href="/admin/leads/export">
            Export CSV
          </a>
          <form action={signOut}>
            <button className="btn line" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {!leadStorageEnabled() && (
        <p className="testbanner" role="note">
          <strong>Sign-ups are in test mode.</strong> New visitors aren’t being saved until the privacy notice is approved and switched on.
        </p>
      )}
      {error && (
        <p className="err" role="alert">
          Couldn’t load leads ({error.code}). Check that the database setup script has been run.
        </p>
      )}

      {leads.length === 0 ? (
        <div className="empty">
          <strong>No leads yet</strong>
          New sign-ups from <Link href="/register">the registration page</Link> appear here.
        </div>
      ) : (
        <div className="tablewrap">
          <table className="leads">
            <thead>
              <tr>
                <th scope="col">Signed up</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Company</th>
                <th scope="col">Employees</th>
                <th scope="col">Role</th>
                <th scope="col">Interests</th>
                <th scope="col">Product news</th>
                <th scope="col">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.lead_id}>
                  <td>{fmt(l.created_at)}</td>
                  <td>{l.full_name}</td>
                  <td>
                    <a href={`mailto:${l.email_normalized}`}>{l.email_normalized}</a>
                    {l.phone_optional && <small>{l.phone_optional}</small>}
                  </td>
                  <td>{l.company_name}</td>
                  <td>{BAND_LABEL[l.employee_count_band as keyof typeof BAND_LABEL] ?? l.employee_count_band}</td>
                  <td>{l.role_optional ?? "—"}</td>
                  <td>{l.interest_categories.length ? l.interest_categories.join(", ") : "—"}</td>
                  <td>{l.marketing_opt_in ? "Yes" : "No"}</td>
                  <td>{fmt(l.last_seen_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="meta">Leads are deleted automatically 90 days after their last visit.</p>
    </main>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<p className="meta">Loading leads…</p>}>
      <LeadsTable />
    </Suspense>
  );
}
