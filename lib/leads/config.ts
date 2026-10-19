import "server-only";
import { NOTICE } from "./notice";

export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseSecretKey = () => process.env.SUPABASE_SECRET_KEY;

export const supabaseConfigured = () => Boolean(supabaseUrl() && supabasePublishableKey() && supabaseSecretKey());

/** Leads are stored only with a configured database and an approved privacy notice. */
export const leadStorageEnabled = () => supabaseConfigured() && NOTICE.approved;
