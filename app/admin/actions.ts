"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl, supabaseConfigured } from "@/lib/leads/config";
import { clientFingerprint } from "@/lib/leads/session";
import { adminClient } from "@/lib/supabase/admin";
import { authClient, isAllowlistedAdmin } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/base-path";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
}

async function siteOrigin() {
  const configured = siteUrl();
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendAdminLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!supabaseConfigured()) {
    return { status: "error", message: "Admin sign-in isn’t set up yet: the Supabase keys need to be added in Vercel." };
  }
  const parsed = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "Enter your email address, like name@company.com." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  const { data: allowed } = await adminClient().rpc("hit_rate_limit", {
    p_bucket: `admin-login:${clientFingerprint(ip)}`,
    p_window_seconds: 600,
    p_max: 5,
  });
  if (allowed === false) return { status: "error", message: "Too many sign-in attempts. Wait ten minutes, then try again." };

  if (await isAllowlistedAdmin(parsed.data)) {
    const supabase = await authClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${await siteOrigin()}${BASE_PATH}/admin/auth/callback`, shouldCreateUser: true },
    });
    if (error) console.error("admin magic link failed", error.code ?? error.status);
  }
  // Same answer either way, so the form doesn't reveal who is an admin.
  return { status: "sent", message: "If that address is on the admin list, a sign-in link is on its way. Open it in this browser." };
}

export async function signOut() {
  if (supabaseConfigured()) await (await authClient()).auth.signOut();
  redirect("/admin/login");
}
