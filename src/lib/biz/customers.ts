import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRedeemed } from "./redeemed";
import type { Customer } from "./types";

const MAX_NOTE = 500;
const MAX_TAGS = 8;
const MAX_TAG = 24;

/** Everyone who redeemed at the business, most recent visit first, with the owner's note and tags. */
export async function listCustomers(db: SupabaseClient, businessId: string): Promise<Customer[]> {
  const [rows, notes] = await Promise.all([
    loadRedeemed(db, businessId),
    db.from("customer_notes").select("resident_id, note, tags").eq("business_id", businessId),
  ]);
  if (notes.error) throw notes.error;
  const noteOf = new Map(notes.data.map((n) => [n.resident_id as string, n]));

  const byCustomer = new Map<string, Customer>();
  for (const r of rows) {
    if (!r.customerId) continue; // resident deleted their account
    const c = byCustomer.get(r.customerId);
    if (c) {
      c.visits++;
      c.totalSpent = Math.round((c.totalSpent + r.amount) * 100) / 100;
    } else {
      const n = noteOf.get(r.customerId);
      byCustomer.set(r.customerId, {
        residentId: r.customerId, firstName: r.firstName, building: r.building, visits: 1, totalSpent: r.amount,
        lastVisit: r.redeemedAt, note: n?.note ?? "", tags: n?.tags ?? [], // rows are newest first, so the first is the last visit
      });
    }
  }
  return [...byCustomer.values()];
}

/** Trims and limits a note and its tags; null if the input isn't a note. */
export function cleanNote(note: unknown, tags: unknown): { note: string; tags: string[] } | null {
  if (typeof note !== "string" || !Array.isArray(tags) || !tags.every((t) => typeof t === "string")) return null;
  const clean = [...new Set((tags as string[]).map((t) => t.trim().slice(0, MAX_TAG)).filter(Boolean))].slice(0, MAX_TAGS);
  return { note: note.trim().slice(0, MAX_NOTE), tags: clean };
}

/** Saves the owner's note for a customer — only for someone who actually redeemed at this business. */
export async function saveNote(db: SupabaseClient, businessId: string, residentId: string, note: string, tags: string[]): Promise<boolean> {
  const { count, error } = await db
    .from("redemptions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("resident_id", residentId)
    .eq("status", "redeemed");
  if (error) throw error;
  if (!count) return false;
  const res = await db
    .from("customer_notes")
    .upsert({ business_id: businessId, resident_id: residentId, note, tags, updated_at: new Date().toISOString() }, { onConflict: "business_id,resident_id" });
  if (res.error) throw res.error;
  return true;
}
