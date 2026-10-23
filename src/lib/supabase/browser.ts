import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Browser Supabase client (publishable key, RLS applies). The session lives in localStorage and its
 * access token is sent to our API as a Bearer token — no cookies, so it also works in a native webview.
 * Returns null if the env vars aren't set.
 */
export function getBrowserClient(): SupabaseClient | null {
  if (client === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    client = url && key ? createClient(url, key) : null;
  }
  return client;
}
