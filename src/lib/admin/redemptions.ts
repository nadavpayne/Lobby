import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toCsv } from "./csv";

/** One line of the redemptions log. */
export interface LogRow {
  id: string;
  issuedAt: string;
  redeemedAt: string | null;
  status: "issued" | "redeemed" | "expired";
  code: string;
  business: string;
  businessId: string;
  building: string;
  apartment: string;
  resident: string | null;
  amount: number | null;
  discount: number | null;
  commission: number | null;
}

export interface LogFilters {
  from: string | null;
  to: string | null;
  businessId: string | null;
  buildingId: string | null;
  status: LogRow["status"] | null;
}

interface Row {
  id: string; issued_at: string; redeemed_at: string | null; status: LogRow["status"]; code: string; business_id: string;
  amount: number | null; discount_amount: number | null; commission_amount: number | null;
  businesses: { name: string }; residents: { name: string | null } | null;
  apartments: { apartment_number: string; buildings: { id: string; name: string | null; address: string } };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Reads log filters from a URL's query string, dropping anything malformed. */
export function parseLogFilters(url: URL): LogFilters {
  const p = url.searchParams;
  const day = (v: string | null) => (v && DAY.test(v) ? v : null);
  const id = (v: string | null) => (v && UUID.test(v) ? v : null);
  const status = p.get("status");
  return {
    from: day(p.get("from")), to: day(p.get("to")), businessId: id(p.get("business")), buildingId: id(p.get("building")),
    status: status === "issued" || status === "redeemed" || status === "expired" ? status : null,
  };
}

/** Matching redemptions, newest first (by issue time), demo data excluded. */
export async function listLog(db: SupabaseClient, f: LogFilters, limit: number): Promise<LogRow[]> {
  let q = db
    .from("redemptions")
    .select(
      "id, issued_at, redeemed_at, status, code, business_id, amount, discount_amount, commission_amount, " +
        "businesses!inner(name, is_demo), residents(name), apartments!inner(apartment_number, buildings!inner(id, name, address))",
    )
    .eq("businesses.is_demo", false)
    .order("issued_at", { ascending: false })
    .limit(limit);
  // Days are Israel calendar days; +02:00/+03:00 drift of an hour at the edges is acceptable for a log filter.
  if (f.from) q = q.gte("issued_at", `${f.from}T00:00:00+03:00`);
  if (f.to) q = q.lte("issued_at", `${f.to}T23:59:59+02:00`);
  if (f.businessId) q = q.eq("business_id", f.businessId);
  if (f.buildingId) q = q.eq("apartments.buildings.id", f.buildingId);
  if (f.status) q = q.eq("status", f.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    id: r.id, issuedAt: r.issued_at, redeemedAt: r.redeemed_at, status: r.status, code: r.code, business: r.businesses.name, businessId: r.business_id,
    building: r.apartments.buildings.name ?? r.apartments.buildings.address, apartment: r.apartments.apartment_number,
    resident: r.residents?.name ?? null,
    amount: r.amount === null ? null : Number(r.amount), discount: r.discount_amount === null ? null : Number(r.discount_amount),
    commission: r.commission_amount === null ? null : Number(r.commission_amount),
  }));
}

const STATUS_HE = { issued: "פעיל", redeemed: "מומש", expired: "פג תוקף" } as const;
const israelTime = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });

/** The log as a CSV file (Hebrew headers, Israel times). */
export function logCsv(rows: LogRow[]): string {
  return toCsv(
    ["תאריך הנפקה", "תאריך מימוש", "סטטוס", "קוד", "עסק", "בניין", "דירה", "דייר", "סכום", "הנחה", "עמלה"],
    rows.map((r) => [
      israelTime.format(new Date(r.issuedAt)), r.redeemedAt ? israelTime.format(new Date(r.redeemedAt)) : null, STATUS_HE[r.status], r.code,
      r.business, r.building, r.apartment, r.resident, r.amount, r.discount, r.commission,
    ]),
  );
}
