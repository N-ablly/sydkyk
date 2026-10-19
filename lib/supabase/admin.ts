import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/leads/config";

let client: SupabaseClient | null = null;

/**
 * Server-only client with the secret key. It bypasses RLS, so it is used only for the leads tables,
 * which have no public policies. Created lazily so builds work before env vars exist.
 */
export function adminClient(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl()!, supabaseSecretKey()!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
