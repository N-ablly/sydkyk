import "server-only";
import { NOTICE } from "./notice";

export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseSecretKey = () => process.env.SUPABASE_SECRET_KEY;

/**
 * Public origin of the site, e.g. https://www.sydkyk.ai. The demo is reached through the website's
 * /experience proxy, so request headers carry the deployment host instead; links and redirects use this.
 */
export const siteUrl = () => process.env.SITE_URL?.replace(/\/+$/, "");

/**
 * Whether /experience asks visitors to register before the demo. Off for now: the demo runs on a shared
 * touch screen, where a sign-up step blocks the queue. Set to true to bring the registration gate back.
 */
export const REGISTRATION_REQUIRED = false;

export const supabaseConfigured = () => Boolean(supabaseUrl() && supabasePublishableKey() && supabaseSecretKey());

/** Leads are stored only with a configured database and an approved privacy notice. */
export const leadStorageEnabled = () => supabaseConfigured() && NOTICE.approved;
