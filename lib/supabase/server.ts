import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "@/lib/leads/config";
import { adminClient } from "./admin";

/** Cookie-based Supabase Auth client for the admin area (publishable key; respects RLS). */
export async function authClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl()!, supabasePublishableKey()!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only; proxy.ts refreshes sessions.
        }
      },
    },
  });
}

export async function isAllowlistedAdmin(email: string): Promise<boolean> {
  const { data, error } = await adminClient().from("lead_admins").select("email").eq("email", email.trim().toLowerCase()).maybeSingle();
  return !error && !!data;
}

/** The signed-in admin's email, or null when not signed in or not on the allowlist. */
export async function currentAdmin(): Promise<string | null> {
  const supabase = await authClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return null;
  return (await isAllowlistedAdmin(email)) ? email.toLowerCase() : null;
}
