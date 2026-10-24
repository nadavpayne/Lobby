import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessStatus } from "@/lib/businesses/types";
import type { AdminBusiness, StatusChange } from "./types";

const COLUMNS =
  "id, name, category, address, city, contact_name, phone, email, status, is_demo, access_slug, created_at, offers(discount_percent, description)";

interface BusinessRow {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string | null;
  contact_name: string;
  phone: string;
  email: string;
  status: BusinessStatus;
  is_demo: boolean;
  access_slug: string;
  created_at: string;
  offers: { discount_percent: number; description: string }[];
}

/** Maps a DB row to the admin view, including the business's personal verification link. */
function toAdminBusiness(row: BusinessRow, baseUrl: string): AdminBusiness {
  const offer = row.offers[0];
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.city ? `${row.address}, ${row.city}` : row.address,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    isDemo: row.is_demo,
    createdAt: row.created_at,
    verifyUrl: `${baseUrl}/b/${row.access_slug}`,
    offer: offer ? { discountPercent: offer.discount_percent, description: offer.description } : null,
  };
}

/** All businesses, newest first. */
export async function listBusinesses(db: SupabaseClient, baseUrl: string): Promise<AdminBusiness[]> {
  const { data, error } = await db.from("businesses").select(COLUMNS).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as BusinessRow[]).map((row) => toAdminBusiness(row, baseUrl));
}

/** Activates or pauses a business; returns the updated business, or null if it doesn't exist. */
export async function setBusinessStatus(db: SupabaseClient, id: string, status: StatusChange, baseUrl: string): Promise<AdminBusiness | null> {
  const { data, error } = await db.from("businesses").update({ status }).eq("id", id).select(COLUMNS).maybeSingle();
  if (error) throw error;
  return data && toAdminBusiness(data as unknown as BusinessRow, baseUrl);
}
