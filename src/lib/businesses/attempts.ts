import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AttemptKind = "pin" | "code";

// Failed attempts allowed per business within the window.
const LIMITS: Record<AttemptKind, number> = { pin: 5, code: 20 };
export const WINDOW_MINUTES = 15;

/** True if the business used up its failed attempts of this kind in the last WINDOW_MINUTES. */
export async function isRateLimited(db: SupabaseClient, businessId: string, kind: AttemptKind): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await db
    .from("business_attempts")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("kind", kind)
    .gte("created_at", since);
  if (error) throw error;
  return (count ?? 0) >= LIMITS[kind];
}

/** Records one failed attempt. */
export async function recordFailure(db: SupabaseClient, businessId: string, kind: AttemptKind): Promise<void> {
  const { error } = await db.from("business_attempts").insert({ business_id: businessId, kind });
  if (error) throw error;
}
