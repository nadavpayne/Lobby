import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "node:crypto";
import { hashPin } from "@/lib/pin";
import type { PlaceColumns } from "@/lib/address/resolve";
import type { JoinData } from "./validateJoin";

/** At most this many sign-ups an hour across the whole site (each stores up to a 5MB photo). */
const SIGNUPS_PER_HOUR = 20;

/**
 * True when the site took its hourly share of business sign-ups.
 * shortcut: one global cap, no per-sender limit (businesses has no ip_hash column); add one if a real flood hits it.
 */
export async function signupsFull(db: SupabaseClient): Promise<boolean> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await db.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
  if (error) throw error;
  return (count ?? 0) >= SIGNUPS_PER_HOUR;
}

/** Creates a pending business and its first offer; returns its id and access_slug. place: the picked address (overrides the typed one). */
export async function createBusiness(data: JoinData, place: PlaceColumns | null = null): Promise<{ id: string; accessSlug: string }> {
  const db = createAdminClient();

  const { data: business, error } = await db
    .from("businesses")
    .insert({
      ...place,
      name: data.name,
      category: data.category,
      subcategories: data.subcategories,
      tags: data.tags,
      address: place?.address ?? data.address,
      city: place?.city ?? data.city,
      contact_name: data.contactName,
      phone: data.phone,
      email: data.email,
      // No PIN at sign-up: owners approve at /biz/scan after email sign-in and add cashier logins there.
      // A random, never-shown secret keeps the old PIN terminal link locked for this business.
      pin_hash: hashPin(randomUUID()),
      agreed_terms_at: new Date().toISOString(),
    })
    .select("id, access_slug")
    .single();
  if (error) throw error;

  const { error: offerError } = await db.from("offers").insert({
    business_id: business.id,
    discount_percent: data.discountPercent,
    description: data.description,
    terms: data.terms,
  });
  if (offerError) {
    // supabase-js has no transactions: undo the business so a retry starts clean.
    await db.from("businesses").delete().eq("id", business.id);
    throw offerError;
  }

  return { id: business.id, accessSlug: business.access_slug };
}
