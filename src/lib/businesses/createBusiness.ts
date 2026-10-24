import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/pin";
import type { JoinData } from "./validateJoin";

/** Creates a pending business and its first offer; returns the business's access_slug. */
export async function createBusiness(data: JoinData): Promise<string> {
  const db = createAdminClient();

  const { data: business, error } = await db
    .from("businesses")
    .insert({
      name: data.name,
      category: data.category,
      address: data.address,
      city: data.city,
      contact_name: data.contactName,
      phone: data.phone,
      email: data.email,
      pin_hash: hashPin(data.pin),
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

  return business.access_slug;
}
