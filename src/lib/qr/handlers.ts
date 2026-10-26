import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { WINDOW_MINUTES } from "@/lib/businesses/attempts";
import { notifyRedeemed } from "@/lib/push/events";
import { parseBillAgorot } from "./money";
import { approve, scan } from "./register";

// Request handling shared by every register: the owner app (/api/biz), the cashier app (/api/biz) and the PIN terminal (/api/business).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** POST body { code } (a scanned QR payload or a typed backup code) → ScanResult. */
export async function handleScan(db: SupabaseClient, businessId: string, actorUserId: string | null, request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const result = await scan(db, businessId, actorUserId, body?.code);
  if (result === "rate_limited") return Response.json({ error: `יותר מדי קודים שגויים. נסו שוב בעוד ${WINDOW_MINUTES} דקות.` }, { status: 429 });
  return Response.json(result);
}

/** POST body { scanId, amount } (pre-discount bill) → ApproveResult. Safe to retry: the scan id is the idempotency key. */
export async function handleApprove(db: SupabaseClient, businessId: string, cashierUserId: string | null, request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const bill = parseBillAgorot(body?.amount);
  if (bill === null) return Response.json({ error: "סכום לא תקין" }, { status: 400 });
  if (typeof body?.scanId !== "string" || !UUID.test(body.scanId)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const result = await approve(db, businessId, body.scanId, bill, cashierUserId);
  if (result.code === "OK" && !result.replay) after(() => notifyRedeemed(db, result.receipt.redemptionId)); // push to the apartment
  return Response.json(result);
}
