import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BenefitType, OneTimeScope } from "@/lib/benefits/types";

export type OfferAction =
  | { action: "approve" }
  | { action: "unapprove" }
  /** Replaces the benefit's terms: a new offer row (approved), the old one deactivated, so history stays. */
  | { action: "benefit"; benefitType: BenefitType; oneTimeScope: OneTimeScope; discountPercent: number }
  | { action: "featured"; featured: boolean }
  | { action: "active"; active: boolean };

/** Parses an admin offer action from a request body; null if invalid. */
export function parseOfferAction(body: unknown): OfferAction | null {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.action === "approve" || b.action === "unapprove") return { action: b.action };
  if (b.action === "benefit") {
    const type = b.benefitType === "one_time" ? "one_time" : b.benefitType === "monthly" ? "monthly" : null;
    const scope = b.oneTimeScope === "resident" ? "resident" : b.oneTimeScope === "apartment" ? "apartment" : null;
    const rate = b.discountPercent;
    if (!type || !scope || !Number.isInteger(rate) || (rate as number) < 1 || (rate as number) > 100) return null;
    return { action: "benefit", benefitType: type, oneTimeScope: scope, discountPercent: rate as number };
  }
  if (b.action === "featured" && typeof b.featured === "boolean") return { action: "featured", featured: b.featured };
  if (b.action === "active" && typeof b.active === "boolean") return { action: "active", active: b.active };
  return null;
}

/** Applies an admin action to an offer: approve (residents see it), un-approve, replace the benefit, feature, pause. */
export async function applyOfferAction(db: SupabaseClient, offerId: string, a: OfferAction): Promise<string | null> {
  if (a.action === "benefit") return replaceBenefit(db, offerId, a);
  const fields =
    a.action === "approve" ? { approved_at: new Date().toISOString() }
    : a.action === "unapprove" ? { approved_at: null, featured: false }
    : a.action === "featured" ? { featured: a.featured }
    : { active: a.active };
  const { data, error } = await db.from("offers").update(fields).eq("id", offerId).select("business_id").maybeSingle<{ business_id: string }>();
  if (error) throw error;
  return data?.business_id ?? null;
}

const COPIED = "business_id, title, description, terms, image_url, category, quantity_limit, starts_at, ends_at, featured";

/**
 * A rate or type change never edits the row in place: the old offer is deactivated and a copy with the new terms
 * takes over (approved now, by the admin). Tokens and redemptions keep pointing at the row they were made from.
 */
async function replaceBenefit(db: SupabaseClient, offerId: string, a: Extract<OfferAction, { action: "benefit" }>): Promise<string | null> {
  const { data: old, error } = await db.from("offers").select(COPIED).eq("id", offerId).maybeSingle<Record<string, unknown> & { business_id: string }>();
  if (error) throw error;
  if (!old) return null;
  const { error: offError } = await db.from("offers").update({ active: false, featured: false }).eq("id", offerId);
  if (offError) throw offError;
  const { error: insError } = await db.from("offers").insert({
    ...old, discount_percent: a.discountPercent, benefit_type: a.benefitType, one_time_scope: a.oneTimeScope, active: true, approved_at: new Date().toISOString(),
  });
  if (insError) throw insError;
  return old.business_id;
}
