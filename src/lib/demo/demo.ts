import type { SupabaseClient } from "@supabase/supabase-js";
import { hashPin } from "../pin.ts";
import { DEMO_CODE, DEMO_PIN } from "./constants.ts";

// Demo data for sales meetings. Relative .ts imports and no "server-only" so scripts/seed-demo.ts can
// run this file directly with Node; it still must only ever get a secret-key client.

const DEMO_RESIDENT_EMAIL = "demo-resident@lobby.invalid";
// Longer than the real 24h so a demo never shows "expired" by surprise; the reset button renews it.
const DEMO_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Row = { id: string };
type DemoBusiness = { id: string; access_slug: string };
type Res<T> = { data: T | null; error: unknown };

/** Data of a response that may have no row; throws on error. */
function maybe<T>({ data, error }: Res<T>): T | null {
  if (error) throw error;
  return data;
}

/** Data of a response that must have a row; throws on error or no row. */
function one<T>(res: Res<T>): NonNullable<T> {
  const data = maybe(res);
  if (data == null) throw new Error("Expected a row");
  return data;
}

/** Creates the demo auth user + resident (or finds the existing one) and returns the resident id. */
async function ensureDemoResident(db: SupabaseClient, apartmentId: string): Promise<string> {
  const created = await db.auth.admin.createUser({ email: DEMO_RESIDENT_EMAIL, email_confirm: true });
  let userId = created.data.user?.id;
  if (!userId) {
    // Already exists from an earlier seed.
    const listed = await db.auth.admin.listUsers({ perPage: 1000 });
    if (listed.error) throw listed.error;
    userId = listed.data.users.find((u) => u.email === DEMO_RESIDENT_EMAIL)?.id;
    if (!userId) throw created.error ?? new Error("Could not create the demo resident");
  }
  maybe(await db.from("residents").upsert({ id: userId, phone: "0500000000", name: "דנה כהן", apartment_id: apartmentId }));
  return userId;
}

/** Creates the demo building, apartment, resident, business and offer if missing. Safe to run repeatedly. */
export async function seedDemo(db: SupabaseClient): Promise<{ businessId: string; accessSlug: string }> {
  const building =
    maybe(await db.from("buildings").select("id").eq("is_demo", true).limit(1).maybeSingle<Row>()) ??
    one(await db.from("buildings").insert({ address: "הרצל 10", city: "תל אביב", is_demo: true, committee_name: "ועד הבית (הדגמה)" }).select("id").single<Row>());

  const apartment = one(
    await db.from("apartments").upsert({ building_id: building.id, apartment_number: "7" }, { onConflict: "building_id,apartment_number" }).select("id").single<Row>(),
  );
  await ensureDemoResident(db, apartment.id);

  const business =
    maybe(await db.from("businesses").select("id, access_slug").eq("is_demo", true).limit(1).maybeSingle<DemoBusiness>()) ??
    one(
      await db
        .from("businesses")
        .insert({
          name: "קפה לובי (הדגמה)",
          category: "food",
          address: "הרצל 12, תל אביב",
          contact_name: "לובי",
          phone: "0500000000",
          email: "demo@lobby.invalid",
          pin_hash: hashPin(DEMO_PIN),
          status: "active",
          is_demo: true,
          agreed_terms_at: new Date().toISOString(),
        })
        .select("id, access_slug")
        .single<DemoBusiness>(),
    );

  if (!maybe(await db.from("offers").select("id").eq("business_id", business.id).limit(1).maybeSingle())) {
    maybe(await db.from("offers").insert({ business_id: business.id, description: "10% הנחה על כל התפריט", terms: "לא כולל אלכוהול" }));
  }

  await resetDemoCode(db, business.id);
  return { businessId: business.id, accessSlug: business.access_slug };
}

/** Makes DEMA24 a fresh, unused code again: clears the demo business's redemptions and failed attempts. */
export async function resetDemoCode(db: SupabaseClient, businessId: string): Promise<void> {
  const business = one(await db.from("businesses").select("is_demo").eq("id", businessId).single<{ is_demo: boolean }>());
  if (!business.is_demo) throw new Error("resetDemoCode called for a non-demo business");

  const apartment = one(
    await db.from("apartments").select("id, buildings!inner(is_demo)").eq("buildings.is_demo", true).limit(1).single<Row>(),
  );
  const resident = maybe(await db.from("residents").select("id").eq("apartment_id", apartment.id).limit(1).maybeSingle<Row>());
  const offer = one(await db.from("offers").select("id").eq("business_id", businessId).limit(1).single<Row>());

  maybe(await db.from("redemptions").delete().eq("business_id", businessId));
  maybe(await db.from("business_attempts").delete().eq("business_id", businessId));
  maybe(
    await db.from("redemptions").insert({
      code: DEMO_CODE,
      apartment_id: apartment.id,
      business_id: businessId,
      offer_id: offer.id,
      resident_id: resident?.id ?? null,
      expires_at: new Date(Date.now() + DEMO_CODE_TTL_MS).toISOString(),
    }),
  );
}
