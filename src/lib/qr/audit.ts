import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEvent {
  event: "token_issued" | "scan" | "redeemed" | "voided";
  result?: string;
  businessId?: string | null;
  tokenId?: string | null;
  redemptionId?: string | null;
  actorUserId?: string | null;
  period?: string | null;
  details?: Record<string, unknown>;
}

/** Writes one audit row and returns its id (a successful scan's id is what "Approve" refers to). */
export async function audit(db: SupabaseClient, e: AuditEvent): Promise<string> {
  const { data, error } = await db
    .from("audit_log")
    .insert({
      event: e.event, result: e.result ?? null, business_id: e.businessId ?? null, token_id: e.tokenId ?? null,
      redemption_id: e.redemptionId ?? null, actor_user_id: e.actorUserId ?? null, period: e.period ?? null, details: e.details ?? {},
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return data.id;
}

/** Server secret that signs QR payloads (shares BUSINESS_TOKEN_SECRET; the signature input is domain-separated). */
export function qrSecret(): string {
  const secret = process.env.BUSINESS_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error("BUSINESS_TOKEN_SECRET must be set (32+ chars)");
  return secret;
}
