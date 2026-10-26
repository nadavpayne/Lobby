"use client";

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

// Supabase auth calls for the login screens; each returns a Hebrew error message or null.

/** Where "forgot password" emails land: the page that sets a new password. */
export const PASSWORD_PAGE = "/account/password";
export const MIN_PASSWORD = 8;

/** Google sign-in is shown only once the provider is set up in Supabase (both projects). */
export const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "on";

/** Hebrew for the auth errors people actually hit. */
function message(error: AuthError, fallback: string): string {
  if (error.status === 429) return "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.";
  if (/invalid login credentials/i.test(error.message)) return "האימייל או הסיסמה שגויים";
  if (/provider is not enabled/i.test(error.message)) return "הכניסה עם Google עוד לא הופעלה";
  if (/same.*password|different from the old/i.test(error.message)) return "זו כבר הסיסמה שלכם";
  if (/weak|at least/i.test(error.message)) return `סיסמה חלשה מדי: לפחות ${MIN_PASSWORD} תווים, אותיות ומספרים`;
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

/** Email + password sign-in for accounts that set a password. */
export async function signInWithPassword(supabase: SupabaseClient, email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error && message(error, "לא הצלחנו להתחבר. נסו שוב.");
}

/** Emails a link that signs in and opens the set-password page. */
export async function sendPasswordReset(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + PASSWORD_PAGE });
  return error && message(error, "לא הצלחנו לשלוח את המייל. בדקו את האימייל ונסו שוב.");
}

/** Sets (or changes) the signed-in account's password. */
export async function setPassword(supabase: SupabaseClient, password: string): Promise<string | null> {
  if (password.length < MIN_PASSWORD) return `הסיסמה צריכה לפחות ${MIN_PASSWORD} תווים`;
  const { error } = await supabase.auth.updateUser({ password });
  return error && message(error, "לא הצלחנו לשמור את הסיסמה. נסו שוב.");
}
