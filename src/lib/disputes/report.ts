import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";
import { audit } from "@/lib/qr/audit";
import { removeReceipt, storeReceipt } from "./receipts";
import { BLOCK_MESSAGE, reportBlock, validateDispute } from "./rules";

export type ReportOutcome = { ok: true } | { ok: false; status: number; error: string; errors?: Record<string, string> };

interface RedemptionRow {
  id: string; apartment_id: string; business_id: string; status: "redeemed" | "voided"; redeemed_at: string; period: string;
  bill_agorot: number; discount_agorot: number; commission_agorot: number;
}

/** Start of the current Israel month as an ISO timestamp (for the per-month report limit; an hour of summer-time drift is fine here). */
function monthStart(): string {
  return new Date(`${currentPeriod()}-01T00:00:00+02:00`).toISOString();
}

/** A resident reports a redemption's amount: checks who and when, validates, stores the photo, saves and audits. */
export async function reportDispute(
  db: SupabaseClient,
  reporter: { userId: string; apartmentId: string },
  form: { redemptionId: unknown; reason: unknown; claimedBill: unknown; note: unknown; photo: unknown },
): Promise<ReportOutcome> {
  if (typeof form.redemptionId !== "string") return { ok: false, status: 400, error: "בקשה לא תקינה" };
  const { data: r, error } = await db
    .from("redemptions")
    .select("id, apartment_id, business_id, status, redeemed_at, period, bill_agorot, discount_agorot, commission_agorot")
    .eq("id", form.redemptionId)
    .maybeSingle<RedemptionRow>();
  if (error && error.code !== "22P02") throw error; // 22P02: not a uuid
  if (!r) return { ok: false, status: 404, error: "המימוש לא נמצא" };

  const [existing, mine] = await Promise.all([
    db.from("redemption_disputes").select("id").eq("redemption_id", r.id).maybeSingle(),
    db.from("redemption_disputes").select("id", { count: "exact", head: true }).eq("reported_by_user_id", reporter.userId).gte("created_at", monthStart()),
  ]);
  if (existing.error) throw existing.error;
  if (mine.error) throw mine.error;

  const block = reportBlock({
    redemption: { apartmentId: r.apartment_id, status: r.status, redeemedAt: r.redeemed_at, billAgorot: r.bill_agorot },
    reporterApartmentId: reporter.apartmentId,
    hasDispute: existing.data !== null,
    reportsThisMonth: mine.count ?? 0,
    now: new Date(),
  });
  if (block) return { ok: false, status: block === "NOT_YOURS" ? 404 : 409, error: BLOCK_MESSAGE[block] };

  const v = validateDispute(form, r.bill_agorot);
  if (!v.ok) return { ok: false, status: 400, error: "יש שדות שצריך לתקן", errors: v.errors };

  const photo = await storeReceipt(db, r.id, form.photo);
  if ("error" in photo) return { ok: false, status: 400, error: photo.error, errors: { photo: photo.error } };

  const { data: d, error: insertError } = await db
    .from("redemption_disputes")
    .insert({
      redemption_id: r.id, business_id: r.business_id, apartment_id: r.apartment_id, reported_by_user_id: reporter.userId,
      reason: v.data.reason, claimed_bill_agorot: v.data.claimedBillAgorot, note: v.data.note, receipt_photo_key: photo.key,
      original_bill_agorot: r.bill_agorot, original_discount_agorot: r.discount_agorot, original_commission_agorot: r.commission_agorot,
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError) {
    if (photo.key) await removeReceipt(db, photo.key);
    // 23505: someone in the apartment reported it a moment ago (one dispute per redemption).
    if (insertError.code === "23505") return { ok: false, status: 409, error: BLOCK_MESSAGE.ALREADY_REPORTED };
    throw insertError;
  }
  await audit(db, {
    event: "dispute_created", result: v.data.reason, businessId: r.business_id, redemptionId: r.id, disputeId: d.id,
    actorUserId: reporter.userId, period: r.period, details: { claimed_bill_agorot: v.data.claimedBillAgorot, photo: photo.key !== null },
  });
  return { ok: true };
}
