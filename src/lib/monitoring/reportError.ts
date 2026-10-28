import "server-only";
import { emailSupportRequest } from "@/lib/support/email";
import type { SupportInput } from "@/lib/support/validate";
import { createAdminClient } from "@/lib/supabase/admin";

const SYSTEM = { name: "מערכת לובי", email: "system@lobby.invalid", role: "other", topic: "other" } as const;
const ALERTS_PER_HOUR = 20;

/**
 * Tells the admin about a server error: a "מערכת לובי" item in the admin support list, emailed when support email is
 * set up. The same error is reported once an hour, and at most 20 alerts an hour overall, so a broken page can't
 * flood the list. Never throws: reporting must not cause a second error.
 */
export async function reportServerError(error: unknown, path: string, digest?: string): Promise<void> {
  try {
    const what = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const key = `שגיאת שרת ב-${path.split("?")[0]}: ${what}`.slice(0, 1500);
    const db = createAdminClient();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // A fresh query each time: Supabase query builders change in place when a filter is added.
    const recent = () => db.from("support_requests").select("id", { count: "exact", head: true }).eq("ip_hash", "system-error").gte("created_at", hourAgo);
    const [same, all] = await Promise.all([recent().like("message", `${key.replace(/[%_\\]/g, "\\$&")}%`), recent()]);
    if ((same.count ?? 0) > 0 || (all.count ?? 0) >= ALERTS_PER_HOUR) return;

    const message = `${key}${digest ? `\nקוד לתמיכה: ${digest}` : ""}\nפרטים מלאים ביומני Vercel.`;
    const { data } = await db.from("support_requests").insert({ ...SYSTEM, message, ip_hash: "system-error" }).select("id").single<{ id: string }>();
    if (data && (await emailSupportRequest({ ...SYSTEM, message } as SupportInput))) {
      await db.from("support_requests").update({ emailed: true }).eq("id", data.id);
    }
  } catch {
    // Nothing more to do: the error itself is still in Vercel's logs.
  }
}
