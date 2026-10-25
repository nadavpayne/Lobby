import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";
import type { BuildingLead, BuildingStage } from "./validate";

/** A building in the admin's committee pipeline. */
export interface AdminBuilding {
  id: string;
  name: string | null;
  address: string;
  city: string;
  pipeline: BuildingStage;
  active: boolean;
  committeeName: string | null;
  committeePhone: string | null;
  apartmentCount: number;
  apartmentsJoined: number;
  members: number;
  redemptionsThisMonth: number;
  /** What the building's residents saved this month (non-voided redemptions). */
  savedThisMonth: number;
  inviteUrl: string;
  createdAt: string;
}

interface Row {
  id: string;
  name: string | null;
  address: string;
  city: string;
  pipeline: BuildingStage;
  active: boolean;
  committee_name: string | null;
  committee_phone: string | null;
  apartment_count: number | null;
  invite_slug: string;
  created_at: string;
}

const COLUMNS = "id, name, address, city, pipeline, active, committee_name, committee_phone, apartment_count, invite_slug, created_at";

/** Every real (non-demo) building with join rate and this month's activity, newest first. */
export async function listBuildings(db: SupabaseClient, origin: string): Promise<AdminBuilding[]> {
  const [buildings, members, redeemed] = await Promise.all([
    db.from("buildings").select(COLUMNS).eq("is_demo", false).order("created_at", { ascending: false }),
    db.from("residents").select("apartment_id, apartments!inner(building_id)").eq("status", "active"),
    db.from("redemptions").select("discount_amount, apartments!inner(building_id)").eq("status", "redeemed").eq("period", currentPeriod()),
  ]);
  for (const r of [buildings, members, redeemed]) if (r.error) throw r.error;

  const joined = new Map<string, Set<string>>();
  const memberCount = new Map<string, number>();
  for (const m of members.data as unknown as { apartment_id: string; apartments: { building_id: string } }[]) {
    const b = m.apartments.building_id;
    joined.set(b, (joined.get(b) ?? new Set()).add(m.apartment_id));
    memberCount.set(b, (memberCount.get(b) ?? 0) + 1);
  }
  const monthCount = new Map<string, number>();
  const monthSaved = new Map<string, number>();
  for (const r of redeemed.data as unknown as { discount_amount: number; apartments: { building_id: string } }[]) {
    const b = r.apartments.building_id;
    monthCount.set(b, (monthCount.get(b) ?? 0) + 1);
    monthSaved.set(b, Math.round(((monthSaved.get(b) ?? 0) + Number(r.discount_amount)) * 100) / 100);
  }

  return (buildings.data as Row[]).map((b) => ({
    id: b.id, name: b.name, address: b.address, city: b.city, pipeline: b.pipeline, active: b.active,
    committeeName: b.committee_name, committeePhone: b.committee_phone, apartmentCount: b.apartment_count ?? 0,
    apartmentsJoined: joined.get(b.id)?.size ?? 0, members: memberCount.get(b.id) ?? 0, redemptionsThisMonth: monthCount.get(b.id) ?? 0, savedThisMonth: monthSaved.get(b.id) ?? 0,
    inviteUrl: `${origin}/i/${b.invite_slug}`, createdAt: b.created_at,
  }));
}

/** Makes sure apartments 1..count exist (new buildings, or a building that grew). */
async function ensureApartments(db: SupabaseClient, buildingId: string, count: number): Promise<void> {
  const rows = Array.from({ length: count }, (_, i) => ({ building_id: buildingId, apartment_number: String(i + 1) }));
  const { error } = await db.from("apartments").upsert(rows, { onConflict: "building_id,apartment_number", ignoreDuplicates: true });
  if (error) throw error;
}

/** Adds a building to the pipeline, or edits one. Only "joined" buildings accept residents (active). */
export async function saveBuilding(db: SupabaseClient, input: BuildingLead, id?: string): Promise<string | null> {
  const fields = {
    name: input.name, address: input.address, city: input.city, committee_name: input.committeeName, committee_phone: input.committeePhone,
    apartment_count: input.apartmentCount, pipeline: input.pipeline, active: input.pipeline === "joined",
  };
  const query = id ? db.from("buildings").update(fields).eq("id", id).eq("is_demo", false) : db.from("buildings").insert(fields);
  const { data, error } = await query.select("id").maybeSingle<{ id: string }>();
  if (error) throw error;
  if (!data) return null;
  await ensureApartments(db, data.id, input.apartmentCount);
  return data.id;
}

/** Issues a new invite link for a building; the old one stops working. */
export async function regenerateInvite(db: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await db
    .from("buildings")
    .update({ invite_slug: crypto.randomUUID().replace(/-/g, "") })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** The monthly committee report: who joined, how much the building used and saved, per business. */
export interface CommitteeReport {
  building: { name: string | null; address: string; city: string; committeeName: string | null; apartmentCount: number };
  period: string;
  apartmentsJoined: number;
  members: number;
  newMembers: number;
  redemptions: number;
  saved: number;
  byBusiness: { name: string; redemptions: number; saved: number }[];
}

/** Builds the committee report for one building and month ("YYYY-MM"). Null if the building doesn't exist. */
export async function committeeReport(db: SupabaseClient, buildingId: string, period: string): Promise<CommitteeReport | null> {
  const { data: b, error } = await db.from("buildings").select(COLUMNS).eq("id", buildingId).maybeSingle<Row>();
  if (error) throw error;
  if (!b) return null;
  const [members, redeemed] = await Promise.all([
    db.from("residents").select("apartment_id, created_at, apartments!inner(building_id)").eq("apartments.building_id", buildingId).eq("status", "active"),
    db
      .from("redemptions")
      .select("discount_amount, businesses(name), apartments!inner(building_id)")
      .eq("apartments.building_id", buildingId)
      .eq("status", "redeemed")
      .eq("period", period),
  ]);
  if (members.error) throw members.error;
  if (redeemed.error) throw redeemed.error;

  const perBusiness = new Map<string, { redemptions: number; saved: number }>();
  for (const r of redeemed.data as unknown as { discount_amount: number; businesses: { name: string } }[]) {
    const p = perBusiness.get(r.businesses.name) ?? { redemptions: 0, saved: 0 };
    p.redemptions++;
    p.saved = Math.round((p.saved + Number(r.discount_amount)) * 100) / 100;
    perBusiness.set(r.businesses.name, p);
  }
  const byBusiness = [...perBusiness].map(([name, v]) => ({ name, ...v })).sort((a, b2) => b2.redemptions - a.redemptions);
  return {
    building: { name: b.name, address: b.address, city: b.city, committeeName: b.committee_name, apartmentCount: b.apartment_count ?? 0 },
    period,
    apartmentsJoined: new Set(members.data.map((m) => m.apartment_id)).size,
    members: members.data.length,
    newMembers: members.data.filter((m) => currentPeriod(new Date(m.created_at)) === period).length,
    redemptions: redeemed.data.length,
    saved: Math.round(byBusiness.reduce((s, x) => s + x.saved, 0) * 100) / 100,
    byBusiness,
  };
}
