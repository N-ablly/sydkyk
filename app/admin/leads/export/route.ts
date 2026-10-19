import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/leads/config";
import { leadsToCsv, type LeadRow } from "@/lib/leads/csv";
import { adminClient } from "@/lib/supabase/admin";
import { currentAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured() || !(await currentAdmin())) {
    return NextResponse.json({ error: "Sign in as an admin to export leads." }, { status: 401 });
  }
  const { data, error } = await adminClient().from("leads").select("*").order("created_at", { ascending: false }).limit(10000);
  if (error) return NextResponse.json({ error: "Couldn’t load leads." }, { status: 503 });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(leadsToCsv((data ?? []) as LeadRow[]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sydkyk-leads-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
