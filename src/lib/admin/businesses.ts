import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessStatus } from "@/lib/businesses/types";
import { hashPin } from "@/lib/pin";
import type { AdminBusiness } from "./types";
import type { BusinessLead } from "./validate";

const COLUMNS =
  "id, name, logo_url, category, address, city, contact_name, phone, email, status, commission_percent, is_demo, access_slug, created_at, " +
  "offers(id, title, description, terms, discount_percent, active, approved_at, featured, starts_at, ends_at, created_at)";

interface BusinessRow {
  id: string;
  name: string;
  logo_url: string | null;
  category: string;
  address: string;
  city: string | null;
  contact_name: string;
  phone: string;
  email: string;
  status: BusinessStatus;
  commission_percent: number;
  is_demo: boolean;
  access_slug: string;
  created_at: string;
  offers: {
    id: string; title: string | null; description: string; terms: string | null; discount_percent: number; active: boolean;
    approved_at: string | null; featured: boolean; starts_at: string | null; ends_at: string | null; created_at: string;
  }[];
}

/** Maps a DB row to the admin view, including the business's personal terminal link. */
function toAdminBusiness(row: BusinessRow, baseUrl: string): AdminBusiness {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    category: row.category,
    address: row.address,
    city: row.city,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    commissionPercent: Number(row.commission_percent),
    isDemo: row.is_demo,
    createdAt: row.created_at,
    verifyUrl: `${baseUrl}/b/${row.access_slug}`,
    offers: [...row.offers]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((o) => ({
        id: o.id, title: o.title ?? `${o.discount_percent}% הנחה`, description: o.description, terms: o.terms, discountPercent: o.discount_percent,
        active: o.active, approved: o.approved_at !== null, featured: o.featured, startsAt: o.starts_at, endsAt: o.ends_at,
      })),
  };
}

/** All businesses, newest first. */
export async function listBusinesses(db: SupabaseClient, baseUrl: string): Promise<AdminBusiness[]> {
  const { data, error } = await db.from("businesses").select(COLUMNS).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as BusinessRow[]).map((row) => toAdminBusiness(row, baseUrl));
}

/** One business (after a change), or null if it doesn't exist. */
export async function getBusiness(db: SupabaseClient, id: string, baseUrl: string): Promise<AdminBusiness | null> {
  const { data, error } = await db.from("businesses").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data && toAdminBusiness(data as unknown as BusinessRow, baseUrl);
}

/** Moves a business along the pipeline (lead → negotiating → live → paused). */
export async function setBusinessStatus(db: SupabaseClient, id: string, status: BusinessStatus): Promise<boolean> {
  const { data, error } = await db.from("businesses").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Sets the contract commission rate (overrides the default 5% for future redemptions). */
export async function setCommission(db: SupabaseClient, id: string, commissionPercent: number): Promise<boolean> {
  const { data, error } = await db.from("businesses").update({ commission_percent: commissionPercent }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  return data !== null;
}

/**
 * Adds a business as a sales lead. It has no terms accepted and a random terminal PIN; when the owner signs in
 * with this email they get /biz and can set their own PIN.
 */
export async function createBusinessLead(db: SupabaseClient, lead: BusinessLead): Promise<string> {
  const randomPin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0");
  const { data, error } = await db
    .from("businesses")
    .insert({
      name: lead.name, category: lead.category, address: lead.address, city: lead.city, contact_name: lead.contactName,
      phone: lead.phone, email: lead.email, pin_hash: hashPin(randomPin), status: "lead", agreed_terms_at: null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return data.id;
}
