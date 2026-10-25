import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** One global-search hit. */
export interface SearchHit {
  kind: "building" | "business" | "resident";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const PER_KIND = 5;

/** Searches buildings (name, address), businesses (name, address, contact, email) and residents (name, phone); 2+ characters. */
export async function globalSearch(db: SupabaseClient, q: string): Promise<SearchHit[]> {
  // Only letters, digits and spaces reach the filter, so the PostgREST or() syntax can't be broken.
  const term = q.replace(/[^\p{L}\p{N} ]/gu, "").trim();
  if (term.length < 2) return [];
  const like = `%${term}%`;
  const [buildings, businesses, residents] = await Promise.all([
    db.from("buildings").select("id, name, address, city").eq("is_demo", false).or(`name.ilike.${like},address.ilike.${like}`).limit(PER_KIND),
    db.from("businesses").select("id, name, address, city").eq("is_demo", false).or(`name.ilike.${like},address.ilike.${like},contact_name.ilike.${like},email.ilike.${like}`).limit(PER_KIND),
    db.from("residents").select("id, name, phone, apartments(apartment_number, buildings(name, address))").or(`name.ilike.${like},phone.ilike.${like}`).limit(PER_KIND),
  ]);
  for (const r of [buildings, businesses, residents]) if (r.error) throw r.error;

  return [
    ...buildings.data!.map((b) => ({ kind: "building" as const, id: b.id, title: b.name ?? b.address, subtitle: `${b.address}, ${b.city}`, href: `/admin/buildings?focus=${b.id}` })),
    ...businesses.data!.map((b) => ({ kind: "business" as const, id: b.id, title: b.name, subtitle: `${b.address}${b.city ? `, ${b.city}` : ""}`, href: `/admin/businesses?focus=${b.id}` })),
    ...(residents.data as unknown as { id: string; name: string | null; phone: string | null; apartments: { apartment_number: string; buildings: { name: string | null; address: string } } | null }[]).map((r) => ({
      kind: "resident" as const, id: r.id, title: r.name ?? r.phone ?? "דייר/ת",
      subtitle: r.apartments ? `${r.apartments.buildings.name ?? r.apartments.buildings.address} · דירה ${r.apartments.apartment_number}` : "לא משויך",
      href: `/admin/residents?q=${encodeURIComponent(r.name ?? r.phone ?? "")}`,
    })),
  ];
}
