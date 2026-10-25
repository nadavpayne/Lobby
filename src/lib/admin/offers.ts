import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OfferAction =
  | { action: "approve" }
  | { action: "unapprove" }
  | { action: "discount"; discountPercent: number }
  | { action: "featured"; featured: boolean }
  | { action: "active"; active: boolean };

/** Parses an admin offer action from a request body; null if invalid. */
export function parseOfferAction(body: unknown): OfferAction | null {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.action === "approve" || b.action === "unapprove") return { action: b.action };
  if (b.action === "discount" && Number.isInteger(b.discountPercent) && (b.discountPercent as number) >= 1 && (b.discountPercent as number) <= 100) {
    return { action: "discount", discountPercent: b.discountPercent as number };
  }
  if (b.action === "featured" && typeof b.featured === "boolean") return { action: "featured", featured: b.featured };
  if (b.action === "active" && typeof b.active === "boolean") return { action: "active", active: b.active };
  return null;
}

/** Applies an admin action to an offer: approve (residents see it), un-approve, override the discount, feature, pause. */
export async function applyOfferAction(db: SupabaseClient, offerId: string, a: OfferAction): Promise<string | null> {
  const fields =
    a.action === "approve" ? { approved_at: new Date().toISOString() }
    : a.action === "unapprove" ? { approved_at: null, featured: false }
    : a.action === "discount" ? { discount_percent: a.discountPercent }
    : a.action === "featured" ? { featured: a.featured }
    : { active: a.active };
  const { data, error } = await db.from("offers").update(fields).eq("id", offerId).select("business_id").maybeSingle<{ business_id: string }>();
  if (error) throw error;
  return data?.business_id ?? null;
}
