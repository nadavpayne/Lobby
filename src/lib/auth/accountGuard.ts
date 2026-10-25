import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** One account per email: the Lobby admin, a business, or a resident (incl. committee). Never two of these. */
export type AccountKind = "admin" | "business" | "resident";

const TAKEN: Record<AccountKind, string> = {
  admin: "האימייל הזה משמש לחשבון הניהול של לובי, ואי אפשר לפתוח איתו חשבון נוסף.",
  business: "האימייל הזה כבר רשום לעסק בלובי. לכל אימייל יש חשבון אחד בלבד.",
  resident: "האימייל הזה כבר רשום לדייר בלובי. לכל אימייל יש חשבון אחד בלבד.",
};

/** Hebrew message for an email that already has an account of this kind. */
export const accountTakenMessage = (kind: AccountKind) => TAKEN[kind];

/** The auth user id for an email, if one exists. */
async function userIdByEmail(db: SupabaseClient, email: string): Promise<string | null> {
  // shortcut: scans the first 1000 auth users; move to a SQL lookup on auth.users past ~1000 accounts
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
}

/** The account this email (or signed-in user) already has, or null if it's free. */
export async function existingAccount(db: SupabaseClient, who: { email: string; userId?: string }): Promise<AccountKind | null> {
  const email = who.email.trim().toLowerCase();
  const userId = who.userId ?? (await userIdByEmail(db, email));

  if (userId) {
    const [roles, resident] = await Promise.all([
      db.from("user_roles").select("role").eq("user_id", userId),
      db.from("residents").select("apartment_id").eq("id", userId).maybeSingle<{ apartment_id: string | null }>(),
    ]);
    if (roles.error) throw roles.error;
    if (resident.error) throw resident.error;
    const granted = roles.data.map((r) => r.role as string);
    if (granted.includes("admin")) return "admin";
    if (granted.includes("business_owner") || granted.includes("cashier")) return "business";
    if (resident.data?.apartment_id) return "resident"; // a row left without an apartment (building deleted) doesn't count
  }

  const { count, error } = await db.from("businesses").select("id", { count: "exact", head: true }).ilike("email", email);
  if (error) throw error;
  return count ? "business" : null;
}
