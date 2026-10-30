import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/qr/audit";
import { receiptUrl } from "./receipts";
import { disputeSignals } from "./signals";
import type { AdminDisputeDetail, AdminDisputeRow, DisputeReason, DisputeSignal, DisputeStatus } from "./types";

/** Queue columns; `redemption` lists the redemption fields to embed (the detail view needs more of them). */
const columns = (redemption = "redeemed_at, bill_agorot") =>
  "id, status, reason, created_at, business_id, claimed_bill_agorot, receipt_photo_key, original_bill_agorot, " +
  `businesses(name), redemptions(${redemption}), apartments(apartment_number, buildings(name, address))`;

interface Row {
  id: string; status: DisputeStatus; reason: DisputeReason; created_at: string; business_id: string; claimed_bill_agorot: number | null;
  receipt_photo_key: string | null; original_bill_agorot: number;
  businesses: { name: string }; redemptions: { redeemed_at: string; bill_agorot: number };
  apartments: { apartment_number: string; buildings: { name: string | null; address: string } };
}

/** Maps a DB row to the queue row. The recorded bill is the one at report time. */
const toRow = (r: Row): AdminDisputeRow => ({
  id: r.id, status: r.status, reason: r.reason, createdAt: r.created_at, businessId: r.business_id, businessName: r.businesses.name,
  apartment: r.apartments.apartment_number, building: r.apartments.buildings.name ?? r.apartments.buildings.address,
  redeemedAt: r.redemptions.redeemed_at, recordedBillAgorot: r.original_bill_agorot, claimedBillAgorot: r.claimed_bill_agorot,
  hasPhoto: r.receipt_photo_key !== null,
});

export interface DisputeFilters {
  /** "active" = open + in review (the default). */
  status: DisputeStatus | "active" | "all";
  businessId: string | null;
  reason: DisputeReason | null;
  from: string | null;
  to: string | null;
}

/** The queue: filtered disputes, oldest first (the longest-waiting report on top). */
export async function listDisputes(db: SupabaseClient, f: DisputeFilters): Promise<AdminDisputeRow[]> {
  let q = db.from("redemption_disputes").select(columns()).order("created_at", { ascending: true }).limit(500);
  if (f.status === "active") q = q.in("status", ["OPEN", "IN_REVIEW"]);
  else if (f.status !== "all") q = q.eq("status", f.status);
  if (f.businessId) q = q.eq("business_id", f.businessId);
  if (f.reason) q = q.eq("reason", f.reason);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00+03:00`);
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59+02:00`);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Row[]).map(toRow);
}

/** One dispute with the resident's note, a signed photo link, the redemption's rates and the business's other disputes. */
export async function getDispute(db: SupabaseClient, id: string): Promise<AdminDisputeDetail | null> {
  const { data, error } = await db
    .from("redemption_disputes")
    .select(`${columns("redeemed_at, bill_agorot, status, discount_rate, commission_rate, commission_base, period")}, ` +
      "note, resolution_note, resolved_at, original_discount_agorot, original_commission_agorot")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = data as unknown as Row & {
    note: string | null; resolution_note: string | null; resolved_at: string | null; original_discount_agorot: number; original_commission_agorot: number;
    redemptions: { status: "redeemed" | "voided"; discount_rate: number; commission_rate: number; commission_base: "gross" | "net"; period: string };
  };
  const history = await db
    .from("redemption_disputes")
    .select("id, status, reason, created_at")
    .eq("business_id", d.business_id)
    .neq("id", d.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (history.error) throw history.error;
  return {
    ...toRow(d),
    note: d.note,
    photoUrl: await receiptUrl(db, d.receipt_photo_key),
    resolutionNote: d.resolution_note,
    resolvedAt: d.resolved_at,
    original: { billAgorot: d.original_bill_agorot, discountAgorot: d.original_discount_agorot, commissionAgorot: d.original_commission_agorot },
    redemption: {
      status: d.redemptions.status, discountRate: Number(d.redemptions.discount_rate), commissionRate: Number(d.redemptions.commission_rate),
      commissionBase: d.redemptions.commission_base, period: d.redemptions.period,
    },
    history: (history.data as { id: string; status: DisputeStatus; reason: DisputeReason; created_at: string }[]).map((h) => ({
      id: h.id, status: h.status, reason: h.reason, createdAt: h.created_at,
    })),
  };
}

export type ActionOutcome = { ok: true } | { ok: false; status: number; error: string };

/** Moves an open dispute to "in review". */
export async function markInReview(db: SupabaseClient, id: string, admin: string): Promise<ActionOutcome> {
  const { data, error } = await db
    .from("redemption_disputes")
    .update({ status: "IN_REVIEW", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "OPEN")
    .select("business_id, redemption_id")
    .maybeSingle<{ business_id: string; redemption_id: string }>();
  if (error) throw error;
  if (!data) return { ok: false, status: 409, error: "אפשר להעביר לבדיקה רק דיווח פתוח" };
  await audit(db, { event: "dispute_status", result: "IN_REVIEW", businessId: data.business_id, redemptionId: data.redemption_id, disputeId: id, actorUserId: admin });
  return { ok: true };
}

const CORRECT_ERRORS: Record<string, [number, string]> = {
  INVALID_AMOUNT: [400, "סכום לא תקין"],
  NOT_FOUND: [404, "הדיווח לא נמצא"],
  ALREADY_RESOLVED: [409, "הדיווח כבר טופל"],
  VOIDED: [409, "המימוש בוטל, אין מה לתקן"],
};

/** Corrects the bill: one database transaction recalculates the redemption, closes the dispute and adds a billing adjustment if needed. */
export async function correctDispute(db: SupabaseClient, id: string, admin: string, billAgorot: number, note: string | null): Promise<ActionOutcome> {
  const { data, error } = await db.rpc("correct_redemption", { p_dispute_id: id, p_bill_agorot: billAgorot, p_admin: admin, p_note: note ?? "" });
  if (error) throw error;
  const code = (data as { code: string }).code;
  if (code === "OK") return { ok: true };
  const [status, message] = CORRECT_ERRORS[code] ?? [500, "משהו השתבש"];
  return { ok: false, status, error: message };
}

/** Dismisses a dispute with a reason the resident sees. */
export async function dismissDispute(db: SupabaseClient, id: string, admin: string, reason: string): Promise<ActionOutcome> {
  const { data, error } = await db
    .from("redemption_disputes")
    .update({ status: "DISMISSED", resolution_note: reason, resolved_by_user_id: admin, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["OPEN", "IN_REVIEW"])
    .select("business_id, redemption_id")
    .maybeSingle<{ business_id: string; redemption_id: string }>();
  if (error) throw error;
  if (!data) return { ok: false, status: 409, error: "הדיווח כבר טופל" };
  await audit(db, { event: "dispute_dismissed", businessId: data.business_id, redemptionId: data.redemption_id, disputeId: id, actorUserId: admin, details: { reason } });
  return { ok: true };
}

/** Dispute rate, corrections and average bill vs. peers for every business in one month (demo businesses excluded). */
export async function signalsForPeriod(db: SupabaseClient, period: string): Promise<DisputeSignal[]> {
  const [redemptions, disputes, businesses] = await Promise.all([
    db.from("redemptions").select("business_id, bill_agorot").eq("status", "redeemed").eq("period", period),
    db.from("redemption_disputes").select("business_id, status, original_bill_agorot, redemptions!inner(period, bill_agorot)").eq("redemptions.period", period),
    db.from("businesses").select("id, category, subcategories, offers(benefit_type, active, approved_at)").eq("is_demo", false),
  ]);
  for (const r of [redemptions, disputes, businesses]) if (r.error) throw r.error;
  const real = new Set(businesses.data!.map((b) => b.id as string));
  // Peers: same subcategory and the same benefit type (first-visit bills of one-time businesses differ).
  const peerGroup = new Map(businesses.data!.map((b) => {
    const live = (b.offers as { benefit_type: string; active: boolean; approved_at: string | null }[]).find((o) => o.active && o.approved_at);
    return [b.id as string, `${live?.benefit_type ?? "monthly"}:${(b.subcategories as string[] | null)?.[0] ?? b.category}`];
  }));
  return disputeSignals({
    redemptions: redemptions.data!.filter((r) => real.has(r.business_id)).map((r) => ({ businessId: r.business_id, billAgorot: r.bill_agorot })),
    disputes: (disputes.data as unknown as { business_id: string; status: DisputeStatus; original_bill_agorot: number; redemptions: { bill_agorot: number } }[])
      .filter((d) => real.has(d.business_id))
      .map((d) => ({ businessId: d.business_id, status: d.status, billDiffAgorot: d.status === "CORRECTED" ? d.redemptions.bill_agorot - d.original_bill_agorot : 0 })),
    peerGroup,
  });
}
