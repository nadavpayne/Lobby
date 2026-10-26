"use client";

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

// Supabase auth calls for the login screens; each returns a Hebrew error message or null.

/** Google sign-in is shown only once the provider is set up in Supabase (both projects). */
export const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "on";

/** Hebrew for the auth errors people actually hit. */
function message(error: AuthError, fallback: string): string {
  if (error.status === 429) return "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.";
  if (/provider is not enabled/i.test(error.message)) return "הכניסה עם Google עוד לא הופעלה";
  return fallback;
}

/** Sends the browser to Google; it comes back to this page signed in (implicit flow, picked up from the URL). */
export async function signInWithGoogle(supabase: SupabaseClient): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  return error && message(error, "לא הצלחנו להתחבר עם Google. נסו שוב.");
}

/** Hebrew for the reason a Google round trip came back without a session (the raw reason is kept for support). */
export function oauthError(reason: string): string {
  if (/access_denied|cancel/i.test(reason)) return "הכניסה עם Google בוטלה.";
  if (/signups? not allowed|signup is disabled/i.test(reason)) return "אין עדיין חשבון לאימייל הזה. דיירים מצטרפים דרך הקישור של ועד הבית.";
  if (/database error/i.test(reason)) return "לא הצלחנו ליצור את החשבון. נסו שוב, ואם זה חוזר פנו לתמיכה.";
  return `הכניסה עם Google לא הצליחה (${reason.slice(0, 120)}). נסו שוב או היכנסו עם קוד למייל.`;
}

