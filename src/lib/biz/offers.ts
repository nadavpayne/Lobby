import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BenefitType, OneTimeScope } from "@/lib/benefits/types";
import type { BizOffer, OfferInput } from "./types";
import { endOfIsraelDay, startOfIsraelDay, toIsraelDay } from "./validateOffer";

const COLUMNS = "id, title, description, terms, image_url, discount_percent, benefit_type, one_time_scope, category, starts_at, ends_at, active, approved_at, created_at";

interface Row {
  id: string;
  title: string | null;
  description: string;
  terms: string | null;
  image_url: string | null;
  discount_percent: number;
  benefit_type: BenefitType;
  one_time_scope: OneTimeScope;
  category: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  approved_at: string | null;
  created_at: string;
}

/** DB row → what the owner sees. */
function toBizOffer(r: Row, fallbackCategory: string): BizOffer {
  return {
    id: r.id,
    title: r.title ?? `${r.discount_percent}% הנחה`,
    description: r.description,
    terms: r.terms,
    discountPercent: r.discount_percent,
    benefitType: r.benefit_type,
    oneTimeScope: r.one_time_scope,
    category: r.category ?? fallbackCategory,
    startsOn: toIsraelDay(r.starts_at),
    endsOn: toIsraelDay(r.ends_at),
    active: r.active,
    approved: r.approved_at !== null,
    createdAt: r.created_at,
  };
}

/** The business's category (offers without their own category use it). */
async function businessCategory(db: SupabaseClient, businessId: string): Promise<string> {
  const { data, error } = await db.from("businesses").select("category").eq("id", businessId).single<{ category: string }>();
  if (error) throw error;
  return data.category;
}

/** All of the business's offers, newest first. */
export async function listBizOffers(db: SupabaseClient, businessId: string): Promise<BizOffer[]> {
  const [{ data, error }, category] = await Promise.all([
    db.from("offers").select(COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false }),
    businessCategory(db, businessId),
  ]);
  if (error) throw error;
  return (data as Row[]).map((r) => toBizOffer(r, category));
}

/**
 * Creates an offer, or edits one of this business's offers. Any content change goes back to Lobby for approval
 * (approved_at cleared), so residents never see text the operator hasn't checked. Returns null if the id isn't theirs.
 */
export async function saveBizOffer(db: SupabaseClient, businessId: string, input: OfferInput, id?: string): Promise<BizOffer | null> {
  const fields = {
    title: input.title,
    description: input.description,
    terms: input.terms,
    discount_percent: input.discountPercent,
    category: input.category,
    starts_at: input.startsOn ? startOfIsraelDay(input.startsOn) : null,
    ends_at: input.endsOn ? endOfIsraelDay(input.endsOn) : null,
    approved_at: null,
  };
  const query = id
    ? db.from("offers").update(fields).eq("id", id).eq("business_id", businessId)
    : db.from("offers").insert({ ...fields, business_id: businessId });
  const { data, error } = await query.select(COLUMNS).maybeSingle<Row>();
  if (error) throw error;
  return data && toBizOffer(data, input.category);
}

/** Pauses or re-activates one of the business's offers (no re-approval needed). Null if not theirs. */
export async function setBizOfferActive(db: SupabaseClient, businessId: string, id: string, active: boolean): Promise<BizOffer | null> {
  const { data, error } = await db.from("offers").update({ active }).eq("id", id).eq("business_id", businessId).select(COLUMNS).maybeSingle<Row>();
  if (error) throw error;
  return data && toBizOffer(data, await businessCategory(db, businessId));
}
