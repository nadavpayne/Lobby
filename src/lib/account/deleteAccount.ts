import "server-only";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getRoles } from "@/lib/auth/roles";
import { deleteLoginIfUnused } from "@/lib/biz/cashiers";
import { deletionNotice, type AccountRole, type DeletionNotice } from "./plan";

/** What the deletion screen needs: the explanation, and residents who could take over the committee. */
export interface AccountDeletionInfo {
  email: string;
  notice: DeletionNotice;
  handoverCandidates: { id: string; name: string; apartment: string }[];
}

/** The account's roles, whether it is its building's only committee member, and who could take over. */
export async function deletionInfo(db: SupabaseClient, user: User): Promise<AccountDeletionInfo> {
  const [{ roles }, me] = await Promise.all([
    getRoles(db, user.id),
    db.from("residents").select("role, apartments(building_id)").eq("id", user.id).maybeSingle<{ role: string; apartments: { building_id: string } }>(),
  ]);
  if (me.error) throw me.error;
  let candidates: AccountDeletionInfo["handoverCandidates"] = [];
  let sole = false;
  if (me.data?.role === "committee") {
    const { data, error } = await db
      .from("residents")
      .select("id, name, role, apartments!inner(apartment_number, building_id)")
      .eq("apartments.building_id", me.data.apartments.building_id)
      .eq("status", "active")
      .neq("id", user.id);
    if (error) throw error;
    const others = data as unknown as { id: string; name: string | null; role: string; apartments: { apartment_number: string } }[];
    sole = !others.some((r) => r.role === "committee");
    candidates = others.map((r) => ({ id: r.id, name: r.name?.trim() || "דייר/ת", apartment: r.apartments.apartment_number }));
  }
  return { email: user.email ?? "", notice: deletionNotice(roles as AccountRole[], sole), handoverCandidates: candidates };
}

/** Checks the fresh email code (re-authentication) against the account's own email. */
async function codeIsValid(user: User, code: string): Promise<boolean> {
  if (!user.email || !/^\d{6,8}$/.test(code)) return false;
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.verifyOtp({ email: user.email, token: code, type: "email" });
  return !error && data.user?.id === user.id;
}

/** Tells the Lobby admin (in the admin support list) that a building no longer has a committee member. */
async function alertCommitteeLeft(db: SupabaseClient, buildingId: string): Promise<void> {
  const { data } = await db.from("buildings").select("name, address, city").eq("id", buildingId).maybeSingle<{ name: string | null; address: string; city: string }>();
  const where = data ? `${data.name ?? data.address}, ${data.city}` : buildingId;
  await db.from("support_requests").insert({
    name: "מערכת לובי", email: "system@lobby.invalid", role: "other", topic: "other", ip_hash: "system",
    message: `חבר/ת הוועד היחיד/ה של הבניין ${where} מחק/ה את החשבון. הבניין נשאר פעיל, בלי ועד ובלי פרטי קשר לוועד.`,
  });
}

export type DeleteOutcome = { ok: true } | { ok: false; status: number; error: string };

const DB_ERRORS: Record<string, [number, string]> = {
  ADMIN: [403, "חשבון ניהול לא נמחק מהאפליקציה"],
  BAD_HANDOVER: [400, "אי אפשר להעביר את תפקיד הוועד לדייר/ת שבחרתם"],
};

/**
 * Deletes the account now: re-authentication with the code, then eraseAccount.
 */
export async function deleteAccount(db: SupabaseClient, user: User, accessToken: string, code: unknown, handoverTo: unknown): Promise<DeleteOutcome> {
  if (typeof code !== "string" || !(await codeIsValid(user, code.trim()))) return { ok: false, status: 401, error: "הקוד שגוי או שפג תוקפו. שלחו קוד חדש." };
  const handover = typeof handoverTo === "string" && handoverTo ? handoverTo : null;
  return eraseAccount(db, user.id, handover, accessToken);
}

/**
 * The deletion itself, for the account holder (after re-authentication) or the Lobby admin: the database part in one
 * transaction (refuses admin accounts), then receipt photos, cashier logins, the holder's sessions when their token is
 * known, and finally the login. Deleting the login also ends every refresh token, so no device stays signed in.
 */
export async function eraseAccount(db: SupabaseClient, userId: string, handover: string | null, accessToken?: string): Promise<DeleteOutcome> {
  const { data, error } = await db.rpc("delete_account_data", { p_user: userId, p_handover: handover });
  if (error) throw error;
  const result = data as { code: string; receipts?: string[]; cashiers?: string[]; building_id?: string | null; committee_left_building?: boolean };
  if (result.code !== "OK") {
    const [status, message] = DB_ERRORS[result.code] ?? [500, "משהו השתבש"];
    return { ok: false, status, error: message };
  }

  if (result.receipts?.length) await db.storage.from("dispute-receipts").remove(result.receipts);
  for (const id of result.cashiers ?? []) await deleteLoginIfUnused(db, id);
  if (result.committee_left_building && result.building_id) await alertCommitteeLeft(db, result.building_id);

  if (accessToken) await db.auth.admin.signOut(accessToken, "global"); // every device
  const removed = await db.auth.admin.deleteUser(userId);
  if (removed.error) throw removed.error;
  return { ok: true };
}
