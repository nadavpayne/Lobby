import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** One coupon a resident used. */
export interface ResidentRedemption {
  id: string;
  business: string;
  businessId: string;
  offer: string;
  redeemedAt: string;
  billAgorot: number;
  savedAgorot: number;
}

/** Everything the admin sees about one resident. */
export interface ResidentDetail {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: "resident" | "committee";
  status: "active" | "pending" | "blocked";
  joinedAt: string;
  building: string | null;
  buildingId: string | null;
  apartment: string | null;
  totals: { redemptions: number; billAgorot: number; savedAgorot: number };
  redemptions: ResidentRedemption[];
}

interface ResidentRow {
  id: string; name: string | null; phone: string | null; role: ResidentDetail["role"]; status: ResidentDetail["status"]; created_at: string;
  apartments: { apartment_number: string; buildings: { id: string; name: string | null; address: string } } | null;
}

interface RedemptionRow {
  id: string; redeemed_at: string; bill_agorot: number | null; discount_agorot: number | null;
  businesses: { id: string; name: string } | null;
  offers: { title: string | null; discount_percent: number } | null;
}

/** One resident with their contact details, apartment, totals and every coupon they used (newest first); null if missing. */
export async function getResidentDetail(db: SupabaseClient, id: string): Promise<ResidentDetail | null> {
  const { data: r, error } = await db
    .from("residents")
    .select("id, name, phone, role, status, created_at, apartments(apartment_number, buildings(id, name, address))")
    .eq("id", id)
    .maybeSingle<ResidentRow>();
  if (error) throw error;
  if (!r) return null;

  const [{ data: auth }, { data: used, error: usedError }] = await Promise.all([
    db.auth.admin.getUserById(id), // the email lives on the login, not on the resident row
    db
      .from("redemptions")
      .select("id, redeemed_at, bill_agorot, discount_agorot, businesses(id, name), offers(title, discount_percent)")
      .eq("resident_id", id)
      .eq("status", "redeemed")
      .order("redeemed_at", { ascending: false }),
  ]);
  if (usedError) throw usedError;

  const redemptions = (used as unknown as RedemptionRow[]).map((u) => ({
    id: u.id,
    business: u.businesses?.name ?? "עסק שנמחק",
    businessId: u.businesses?.id ?? "",
    offer: u.offers?.title ?? (u.offers ? `${u.offers.discount_percent}% הנחה` : ""),
    redeemedAt: u.redeemed_at,
    billAgorot: u.bill_agorot ?? 0,
    savedAgorot: u.discount_agorot ?? 0,
  }));
  const building = r.apartments?.buildings;
  return {
    id: r.id, name: r.name, phone: r.phone, email: auth?.user?.email ?? null, role: r.role, status: r.status, joinedAt: r.created_at,
    building: building ? building.name ?? building.address : null, buildingId: building?.id ?? null, apartment: r.apartments?.apartment_number ?? null,
    totals: {
      redemptions: redemptions.length,
      billAgorot: redemptions.reduce((s, u) => s + u.billAgorot, 0),
      savedAgorot: redemptions.reduce((s, u) => s + u.savedAgorot, 0),
    },
    redemptions,
  };
}
