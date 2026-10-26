import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendApns, type PushMessage } from "./apns";
import { parsePrefs, wants, type NotificationPrefs, type NotificationType } from "./prefs";

/** Pushes a message to every device of these accounts that wants this type. Never throws: a push is a bonus. */
export async function notifyUsers(db: SupabaseClient, userIds: string[], type: NotificationType, message: PushMessage): Promise<void> {
  try {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return;
    const [prefs, tokens] = await Promise.all([
      db.from("notification_prefs").select("*").in("user_id", ids),
      db.from("push_tokens").select("token, user_id").in("user_id", ids),
    ]);
    if (prefs.error || tokens.error) return;
    const saved = new Map(prefs.data.map((p) => [p.user_id as string, p as Partial<NotificationPrefs>]));
    const targets = tokens.data.filter((t) => wants(saved.get(t.user_id) ?? null, type)).map((t) => t.token as string);
    const dead = await sendApns(targets, message);
    if (dead.length) await db.from("push_tokens").delete().in("token", dead);
  } catch {
    // shortcut: failures are silent; add logging once push volume matters.
  }
}

/** Saves this device's token for the account (moves it if another account used the device before). */
export async function saveToken(db: SupabaseClient, userId: string, token: unknown, platform: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length < 32 || token.length > 512 || (platform !== "ios" && platform !== "android")) return false;
  const { error } = await db.from("push_tokens").upsert({ token, user_id: userId, platform, updated_at: new Date().toISOString() });
  if (error) throw error;
  return true;
}

/** Forgets this device's token (sign-out). */
export async function removeToken(db: SupabaseClient, userId: string, token: unknown): Promise<void> {
  if (typeof token !== "string") return;
  const { error } = await db.from("push_tokens").delete().eq("token", token).eq("user_id", userId);
  if (error) throw error;
}

/** The account's switches (defaults filled in). */
export async function getPrefs(db: SupabaseClient, userId: string): Promise<NotificationPrefs> {
  const { data, error } = await db.from("notification_prefs").select("new_benefits, redemptions, disputes, biz_summary").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  const saved = parsePrefs(data);
  return { new_benefits: wants(saved, "new_benefits"), redemptions: wants(saved, "redemptions"), disputes: wants(saved, "disputes"), biz_summary: wants(saved, "biz_summary") };
}

/** Saves some switches; returns all of them. */
export async function setPrefs(db: SupabaseClient, userId: string, raw: unknown): Promise<NotificationPrefs> {
  const next = { ...(await getPrefs(db, userId)), ...parsePrefs(raw) };
  const { error } = await db.from("notification_prefs").upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() });
  if (error) throw error;
  return next;
}
