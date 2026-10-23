import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Server-only Supabase client using the secret key. Bypasses RLS: always filter by the caller's business/apartment. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}
