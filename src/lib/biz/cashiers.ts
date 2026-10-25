import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** A scan-only login of the business. */
export interface Cashier {
  userId: string;
  email: string;
  addedAt: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails for a few user ids (cashier names in the log). */
export async function emailsOf(db: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  await Promise.all(userIds.map(async (id) => {
    const { data } = await db.auth.admin.getUserById(id);
    if (data.user?.email) out.set(id, data.user.email);
  }));
  return out;
}

/** The business's cashiers, newest first. */
export async function listCashiers(db: SupabaseClient, businessId: string): Promise<Cashier[]> {
  const { data, error } = await db.from("user_roles").select("user_id, created_at").eq("business_id", businessId).eq("role", "cashier").order("created_at", { ascending: false });
  if (error) throw error;
  const emails = await emailsOf(db, data.map((r) => r.user_id));
  return data.map((r) => ({ userId: r.user_id, email: emails.get(r.user_id) ?? "—", addedAt: r.created_at }));
}

/** The auth user id for an email, creating a confirmed account (signs in later with an email code) if none exists. */
async function userIdFor(db: SupabaseClient, email: string): Promise<string> {
  const created = await db.auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  // shortcut: scans the first 1000 accounts to find an existing one; use a lookup by email when the user base grows.
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const found = data.users.find((u) => u.email?.toLowerCase() === email);
  if (!found) throw created.error ?? new Error("Could not create the cashier account");
  return found.id;
}

/**
 * Gives an email a scan-only login at the business. Refused for the owner's own account (owners already have the
 * register) and for an account that's a cashier elsewhere (one business per cashier keeps scans unambiguous).
 */
export async function addCashier(db: SupabaseClient, businessId: string, rawEmail: unknown): Promise<"ok" | "invalid" | "elsewhere" | "owner"> {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) return "invalid";
  const userId = await userIdFor(db, email);
  const { data: roles, error } = await db.from("user_roles").select("role, business_id").eq("user_id", userId);
  if (error) throw error;
  if (roles.some((r) => r.role === "business_owner" && r.business_id === businessId)) return "owner";
  if (roles.some((r) => r.role === "cashier" && r.business_id !== businessId)) return "elsewhere";
  const res = await db.from("user_roles").upsert({ user_id: userId, role: "cashier", business_id: businessId }, { onConflict: "user_id,role,business_id", ignoreDuplicates: true });
  if (res.error) throw res.error;
  return "ok";
}

/** Revokes a cashier's access to the business (their past scans stay in the log). */
export async function revokeCashier(db: SupabaseClient, businessId: string, userId: string): Promise<void> {
  const { error } = await db.from("user_roles").delete().eq("user_id", userId).eq("business_id", businessId).eq("role", "cashier");
  if (error) throw error;
}
