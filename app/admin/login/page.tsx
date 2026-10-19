import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/leads/admin-login-form";
import { supabaseConfigured } from "@/lib/leads/config";
import { currentAdmin } from "@/lib/supabase/server";

type Search = Promise<{ error?: string }>;

async function LinkError({ searchParams }: { searchParams: Search }) {
  await connection();
  if (supabaseConfigured() && (await currentAdmin())) redirect("/admin/leads");
  const { error } = await searchParams;
  return error === "link" ? (
    <p className="err" role="alert">
      That sign-in link didn’t work. Links expire after an hour and only open in the browser that requested them. Request a new one.
    </p>
  ) : null;
}

export default function AdminLogin({ searchParams }: { searchParams: Search }) {
  return (
    <main className="panel slim">
      <h1 className="ptitle">Leads admin</h1>
      <p className="lede">Sign in with an email on the admin list. We’ll email you a one-time link; there’s no password.</p>
      <Suspense fallback={null}>
        <LinkError searchParams={searchParams} />
      </Suspense>
      <AdminLoginForm />
    </main>
  );
}
