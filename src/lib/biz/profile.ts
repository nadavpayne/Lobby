import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeekHours } from "@/lib/offers/hours";
import { hashPin } from "@/lib/pin";
import type { BizProfile, ProfileInput } from "./types";

interface Row {
  name: string;
  category: string;
  description: string | null;
  phone: string;
  address: string;
  city: string | null;
  logo_url: string | null;
  hours: WeekHours | null;
  commission_percent: number;
  access_slug: string;
  branches: { name: string; address: string }[];
}

/** The profile screen's data; terminalUrl is built from the request's host. */
export async function getProfile(db: SupabaseClient, businessId: string, origin: string): Promise<BizProfile> {
  const { data, error } = await db
    .from("businesses")
    .select("name, category, description, phone, address, city, logo_url, hours, commission_percent, access_slug, branches(name, address)")
    .eq("id", businessId)
    .single<Row>();
  if (error) throw error;
  return {
    name: data.name,
    category: data.category,
    description: data.description,
    phone: data.phone,
    address: data.address,
    city: data.city,
    logoUrl: data.logo_url,
    hours: data.hours ?? {},
    branches: data.branches,
    commissionPercent: Number(data.commission_percent),
    terminalUrl: `${origin}/b/${data.access_slug}`,
  };
}

/** Saves the editable details (not the logo: see saveLogo) and replaces the branch list (redemptions keep their history; branch_id is set null). */
export async function saveProfile(db: SupabaseClient, businessId: string, p: ProfileInput, city: string | null): Promise<void> {
  const res = await db
    .from("businesses")
    .update({ description: p.description, phone: p.phone, address: p.address, hours: p.hours })
    .eq("id", businessId);
  if (res.error) throw res.error;
  const del = await db.from("branches").delete().eq("business_id", businessId);
  if (del.error) throw del.error;
  if (p.branches.length === 0) return;
  // Branches are in the business's city (offers are matched to buildings by city).
  const ins = await db.from("branches").insert(p.branches.map((b) => ({ ...b, business_id: businessId, city: city ?? "" })));
  if (ins.error) throw ins.error;
}

/** Sets a new staff terminal PIN. Device tokens are tied to the PIN hash, so every terminal must sign in again. */
export async function changeTerminalPin(db: SupabaseClient, businessId: string, pin: string): Promise<void> {
  const { error } = await db.from("businesses").update({ pin_hash: hashPin(pin) }).eq("id", businessId);
  if (error) throw error;
}
