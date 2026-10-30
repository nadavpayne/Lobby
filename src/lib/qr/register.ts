import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eligibilityKey } from "@/lib/benefits/eligibility";
import type { BenefitType, OneTimeScope } from "@/lib/benefits/types";
import { isRateLimited, recordFailure } from "@/lib/businesses/attempts";
import { currentPeriod, nextPeriodStart } from "@/lib/period";
import { audit, qrSecret } from "./audit";
import { normalizeBackupCode } from "./backupCode";
import { classifyScan } from "./classify";
import { RECEIPT_COLUMNS, toReceipt } from "./issue";
import { isQrPayload, readQr } from "./signing";
import type { ApproveResult, PreviousRedemption, ScanResult } from "./types";

// The register: scan (validate + lock) and approve (record). Used by the owner app, the cashier app and the PIN terminal.

interface TokenRow {
  id: string;
  business_id: string;
  status: "active" | "used" | "replaced";
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  apartment_id: string;
  resident_id: string | null;
  discount_rate: number;
  commission_rate: number | null;
  commission_base: "gross" | "net" | null;
  benefit_type: BenefitType;
  one_time_scope: OneTimeScope;
  apartments: { apartment_number: string };
}

const TOKEN_COLUMNS =
  "id, business_id, status, issued_at, expires_at, used_at, apartment_id, resident_id, discount_rate, commission_rate, commission_base, benefit_type, one_time_scope, apartments(apartment_number)";

/** Finds the token behind a scanned QR or a typed backup code (preferring this business's active one). */
async function findToken(db: SupabaseClient, businessId: string, input: string): Promise<TokenRow | null> {
  if (isQrPayload(input)) {
    const id = readQr(input, qrSecret());
    if (!id) return null;
    const { data, error } = await db.from("redemption_tokens").select(TOKEN_COLUMNS).eq("id", id).maybeSingle<TokenRow>();
    if (error) throw error;
    return data;
  }
  const code = normalizeBackupCode(input);
  if (!code) return null;
  const { data, error } = await db.from("redemption_tokens").select(TOKEN_COLUMNS).eq("backup_code", code).order("issued_at", { ascending: false }).limit(20);
  if (error) throw error;
  const rows = data as unknown as TokenRow[];
  const mine = rows.filter((t) => t.business_id === businessId);
  return mine.find((t) => t.status === "active") ?? mine[0] ?? rows.find((t) => t.status === "active") ?? null;
}

/** The redemption that already holds the token's eligibility key at the business, if any. */
async function previousRedemption(db: SupabaseClient, t: TokenRow, period: string): Promise<PreviousRedemption | null> {
  const key = eligibilityKey({ benefitType: t.benefit_type, oneTimeScope: t.one_time_scope, apartmentId: t.apartment_id, residentId: t.resident_id, period });
  const { data, error } = await db
    .from("redemptions")
    .select("redeemed_at, bill_agorot, discount_agorot")
    .eq("business_id", t.business_id)
    .eq("eligibility_key", key)
    .eq("status", "redeemed")
    .limit(1)
    .maybeSingle<{ redeemed_at: string; bill_agorot: number; discount_agorot: number }>();
  if (error) throw error;
  return data && { redeemedAt: data.redeemed_at, billAgorot: data.bill_agorot, discountAgorot: data.discount_agorot };
}

/** A redemption's receipt numbers for the "already used" screens. */
async function previousById(db: SupabaseClient, id: string): Promise<PreviousRedemption> {
  const { data, error } = await db.from("redemptions").select("redeemed_at, bill_agorot, discount_agorot").eq("id", id).single();
  if (error) throw error;
  return { redeemedAt: data.redeemed_at, billAgorot: data.bill_agorot, discountAgorot: data.discount_agorot };
}

/**
 * Checks a scanned QR or typed backup code at this business and records the attempt. On OK the scan id it returns
 * locks the token to this scan: the cashier can take their time with the amount. Wrong codes count toward the
 * per-business limit (stops guessing backup codes).
 */
export async function scan(db: SupabaseClient, businessId: string, actorUserId: string | null, raw: unknown): Promise<ScanResult | "rate_limited"> {
  const input = typeof raw === "string" ? raw.slice(0, 200) : "";
  if (await isRateLimited(db, businessId, "code")) return "rate_limited";
  const method = isQrPayload(input) ? "qr" : "backup";
  const now = new Date();
  const period = currentPeriod(now);

  const token = await findToken(db, businessId, input);
  const previous = token && token.business_id === businessId ? await previousRedemption(db, token, period) : null;
  const code = classifyScan(token && { businessId: token.business_id, status: token.status, expiresAt: token.expires_at, benefitType: token.benefit_type }, businessId, previous !== null, now);

  const scanId = await audit(db, {
    event: "scan", result: code, businessId, tokenId: token?.id ?? null, actorUserId, period: code === "OK" ? period : null, details: { method },
  });
  if (code === "INVALID_CODE") await recordFailure(db, businessId, "code");

  switch (code) {
    case "OK": {
      // Rates from the token's snapshot (tokens issued before the snapshot existed fall back to the business).
      let commissionRate = token!.commission_rate;
      let commissionBase = token!.commission_base;
      if (commissionRate === null || commissionBase === null) {
        const { data: b, error } = await db.from("businesses").select("commission_percent, commission_base").eq("id", businessId).single<{ commission_percent: number; commission_base: "gross" | "net" }>();
        if (error) throw error;
        commissionRate = b.commission_percent;
        commissionBase = b.commission_base;
      }
      return {
        code, scanId, apartmentNumber: token!.apartments.apartment_number, discountRate: Number(token!.discount_rate), commissionRate: Number(commissionRate), commissionBase,
        benefitType: token!.benefit_type, oneTimeScope: token!.one_time_scope,
      };
    }
    case "ALREADY_REDEEMED_THIS_MONTH":
      return { code, apartmentNumber: token!.apartments.apartment_number, previous: previous!, renewsOn: nextPeriodStart(now) };
    case "ALREADY_REDEEMED_ONE_TIME":
      return { code, apartmentNumber: token!.apartments.apartment_number, previous: previous! };
    case "CODE_EXPIRED":
      return { code, issuedAt: token?.issued_at ?? null, expiresAt: token?.expires_at ?? null };
    case "CODE_ALREADY_USED":
      return { code, usedAt: token?.used_at ?? null };
    default:
      return { code };
  }
}

/**
 * Records the redemption for an OK scan with the pre-discount bill, in one DB transaction (approve_redemption).
 * Retrying the same scan returns the same redemption, so a lost response never creates two.
 */
export async function approve(db: SupabaseClient, businessId: string, scanId: string, billAgorot: number, cashierUserId: string | null): Promise<ApproveResult> {
  const { data, error } = await db.rpc("approve_redemption", { p_scan_id: scanId, p_business_id: businessId, p_bill_agorot: billAgorot, p_cashier: cashierUserId });
  if (error) throw error;
  const res = data as { code: string; redemption_id?: string; replay?: boolean; previous_id?: string };

  if (res.code === "OK") {
    const { data: r, error: rError } = await db.from("redemptions").select(`${RECEIPT_COLUMNS}, commission_agorot`).eq("id", res.redemption_id!).single();
    if (rError) throw rError;
    return { code: "OK", receipt: toReceipt(r as never), commissionAgorot: (r as { commission_agorot: number }).commission_agorot, replay: !!res.replay };
  }
  if (res.code === "ALREADY_REDEEMED_THIS_MONTH" || res.code === "ALREADY_REDEEMED_ONE_TIME") {
    const previous = res.previous_id ? await previousById(db, res.previous_id) : null;
    return res.code === "ALREADY_REDEEMED_THIS_MONTH" ? { code: res.code, previous, renewsOn: nextPeriodStart() } : { code: res.code, previous };
  }
  return { code: res.code as "CODE_ALREADY_USED" | "CODE_EXPIRED" | "INVALID_CODE" | "INVALID_AMOUNT" };
}

/** Voids one of the business's redemptions (owner only, checked by the caller): keeps the row, frees the slot. */
export async function voidRedemption(db: SupabaseClient, businessId: string, redemptionId: string, userId: string, reason: string): Promise<boolean> {
  const { data, error } = await db.rpc("void_redemption", { p_id: redemptionId, p_business_id: businessId, p_user: userId, p_reason: reason });
  if (error) throw error;
  return data === true;
}
