import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Role } from "./homeFor";

export interface AccountRoles {
  roles: Role[];
  /** Businesses this account owns (business_owner rows). */
  businessIds: string[];
}

/** All roles of an account: user_roles rows plus the residents row (resident or committee). */
export async function getRoles(db: SupabaseClient, userId: string): Promise<AccountRoles> {
  const [granted, resident] = await Promise.all([
    db.from("user_roles").select("role, business_id").eq("user_id", userId),
    db.from("residents").select("role").eq("id", userId).maybeSingle<{ role: "resident" | "committee" }>(),
  ]);
  if (granted.error) throw granted.error;
  if (resident.error) throw resident.error;

  const rows = granted.data as { role: "admin" | "business_owner"; business_id: string | null }[];
  const roles = new Set<Role>(rows.map((r) => r.role));
  if (resident.data) roles.add(resident.data.role);
  return { roles: [...roles], businessIds: rows.flatMap((r) => (r.business_id ? [r.business_id] : [])) };
}

/**
 * Makes the account the owner of every business registered with its (verified) email, if not already.
 * This is how an owner who signed up through /join gets into /biz the first time they sign in.
 */
export async function linkOwnedBusinesses(db: SupabaseClient, user: User): Promise<void> {
  if (!user.email || !user.email_confirmed_at) return;
  const { data, error } = await db.from("businesses").select("id").ilike("email", user.email).eq("is_demo", false);
  if (error) throw error;
  if (data.length === 0) return;
  const rows = data.map((b) => ({ user_id: user.id, role: "business_owner", business_id: b.id }));
  const res = await db.from("user_roles").upsert(rows, { onConflict: "user_id,role,business_id", ignoreDuplicates: true });
  if (res.error) throw res.error;
}
