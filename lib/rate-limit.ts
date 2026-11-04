import "server-only";
import { supabaseConfigured } from "@/lib/leads/config";
import { adminClient } from "@/lib/supabase/admin";

/** [bucket, window in seconds, max hits per window] */
export type Bucket = [string, number, number];

// Fallback limiter for deployments without Supabase (per server instance only).
const memory = new Map<string, { window: number; hits: number }>();
function memoryLimit(key: string, windowSec: number, max: number) {
  const w = Math.floor(Date.now() / 1000 / windowSec);
  const cur = memory.get(key);
  const hits = cur && cur.window === w ? cur.hits + 1 : 1;
  memory.set(key, { window: w, hits });
  return hits <= max;
}

/** Counts one hit in every bucket; false as soon as one is over its limit. */
export async function withinLimits(buckets: Bucket[]) {
  for (const [bucket, window, max] of buckets) {
    if (supabaseConfigured()) {
      const { data, error } = await adminClient().rpc("hit_rate_limit", { p_bucket: bucket, p_window_seconds: window, p_max: max });
      if (!error && data === false) return false;
      if (!error) continue;
    }
    if (!memoryLimit(bucket, window, max)) return false;
  }
  return true;
}

/** Daily ceiling across every way of asking (demo page and Google Chat), to cap model spend. */
export const GLOBAL_ASK_BUCKET: Bucket = ["ask:global", 86_400, 2_000];
