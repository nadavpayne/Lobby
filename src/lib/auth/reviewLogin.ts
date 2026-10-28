import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const FAIL_DELAY_MS = 1500;

/** True when both strings are equal, compared in constant time. */
function same(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * App Store / Google Play reviewers can't read our email codes, so one demo account (REVIEW_LOGIN_EMAIL) also accepts
 * a fixed code (REVIEW_LOGIN_CODE, 6 digits like the real ones). Off unless both are set. Returns a one-time sign-in
 * token hash for the browser to exchange, or null.
 * shortcut: a 6-digit code is guessable with enough tries; the email is private (only in the store review notes),
 * every wrong try on it waits 1.5s, and the account sits in the demo building. Unset both after approval.
 */
export async function reviewLoginTokenHash(db: SupabaseClient, email: unknown, code: unknown): Promise<string | null> {
  const reviewEmail = process.env.REVIEW_LOGIN_EMAIL?.trim().toLowerCase();
  const reviewCode = process.env.REVIEW_LOGIN_CODE?.trim();
  if (!reviewEmail || !reviewCode || typeof email !== "string" || typeof code !== "string") return null;
  if (email.trim().toLowerCase() !== reviewEmail) return null;
  if (!same(code.trim(), reviewCode)) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return null;
  }
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email: reviewEmail });
  if (error) throw error;
  return data.properties.hashed_token;
}
