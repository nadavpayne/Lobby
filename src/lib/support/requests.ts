import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailSupportRequest } from "./email";
import { isBot, rateLimited, validateSupport, type SupportErrors } from "./validate";

export type SubmitOutcome = { ok: true } | { ok: false; status: number; error: string; errors?: SupportErrors };

/** A salted hash of the sender's IP (rate limiting only; the raw IP is never stored). */
function ipHash(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${process.env.BUSINESS_TOKEN_SECRET ?? ""}|${ip}`).digest("hex");
}

/** Validates, rate-limits, saves and emails one support request. Honeypot hits look successful but save nothing. */
export async function submitSupportRequest(db: SupabaseClient, request: Request, raw: Record<string, unknown> | null, userId: string | null): Promise<SubmitOutcome> {
  if (isBot(raw)) return { ok: true };
  const v = validateSupport(raw);
  if (!v.ok) return { ok: false, status: 400, error: "יש שדות שצריך לתקן", errors: v.errors };

  const hash = ipHash(request);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [byIp, byEmail] = await Promise.all([
    db.from("support_requests").select("id", { count: "exact", head: true }).eq("ip_hash", hash).gte("created_at", hourAgo),
    db.from("support_requests").select("id", { count: "exact", head: true }).ilike("email", v.data.email).gte("created_at", hourAgo),
  ]);
  if (byIp.error) throw byIp.error;
  if (byEmail.error) throw byEmail.error;
  if (rateLimited({ byIp: byIp.count ?? 0, byEmail: byEmail.count ?? 0 })) {
    return { ok: false, status: 429, error: "שלחתם כמה פניות ממש עכשיו. נסו שוב בעוד שעה." };
  }

  const { data, error } = await db.from("support_requests").insert({ ...v.data, user_id: userId, ip_hash: hash }).select("id").single<{ id: string }>();
  if (error) throw error;
  if (await emailSupportRequest(v.data)) await db.from("support_requests").update({ emailed: true }).eq("id", data.id);
  return { ok: true };
}

/** One request in the admin list. */
export interface AdminSupportRequest {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  role: string;
  topic: string;
  message: string;
  status: "open" | "answered" | "closed";
  emailed: boolean;
}

/** Support requests, newest first, filtered by status, topic and role. */
export async function listSupportRequests(db: SupabaseClient, f: { status: string | null; topic: string | null; role: string | null }): Promise<AdminSupportRequest[]> {
  let q = db.from("support_requests").select("id, created_at, name, email, role, topic, message, status, emailed").order("created_at", { ascending: false }).limit(300);
  if (f.status) q = q.eq("status", f.status);
  if (f.topic) q = q.eq("topic", f.topic);
  if (f.role) q = q.eq("role", f.role);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((r) => ({ id: r.id, createdAt: r.created_at, name: r.name, email: r.email, role: r.role, topic: r.topic, message: r.message, status: r.status, emailed: r.emailed }));
}

/** Moves a request to open / answered / closed. */
export async function setSupportStatus(db: SupabaseClient, id: string, status: AdminSupportRequest["status"]): Promise<boolean> {
  const { data, error } = await db.from("support_requests").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  return data !== null;
}
