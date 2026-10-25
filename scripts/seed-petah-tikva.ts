// Fills a DEV database with a living Petah Tikva demo: 5 buildings (+2 committee leads), 15 businesses (+2 leads),
// 60 residents and 3 months of redemptions, invoices and customer notes.
// WIPES all app data and all *@seed.lobby.invalid accounts first, so it refuses to run unless SEED_TARGET=dev.
// Run: npm run seed:dev   (reads .env.dev.local)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateCode } from "../src/lib/codes.ts";
import { hashPin } from "../src/lib/pin.ts";
import { BUILDINGS, BUSINESSES, CITY, FIRST_NAMES, HOURS, LAST_NAMES, LEAD_BUILDINGS, LEAD_BUSINESSES } from "./seed/data.ts";
import { lastMonths, planRedemptions, seededRandom, type PlanApartment } from "./seed/generate.ts";

const SEED_DOMAIN = "seed.lobby.invalid";
const RESIDENTS_PER_BUILDING = 12;
const TERMINAL_PIN = "1234";
const DAY = 24 * 60 * 60 * 1000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.dev.local first");
if (process.env.SEED_TARGET !== "dev") throw new Error("Refusing to wipe: set SEED_TARGET=dev in .env.dev.local (never on production)");

const db = createClient(url, key, { auth: { persistSession: false } });
const random = seededRandom(2026);
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);

/** Data of a Supabase response; throws on error. */
function check<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error;
  return data as T;
}

/** A random item of a list. */
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];

/** Deletes every row of the app tables (children first) and every seeded auth account. */
async function wipe(client: SupabaseClient): Promise<void> {
  for (const table of ["redemptions", "customer_notes", "invoices", "user_roles", "devices", "business_attempts", "offers", "branches", "residents", "apartments", "businesses", "buildings"]) {
    check(await client.from(table).delete().not("id", "is", null));
  }
  const { data, error } = await client.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const u of data.users.filter((u) => u.email?.endsWith(`@${SEED_DOMAIN}`))) {
    const { error: deleteError } = await client.auth.admin.deleteUser(u.id);
    if (deleteError) throw deleteError;
  }
}

/** The auth user id for an email, creating a confirmed account if there is none. */
async function ensureUser(client: SupabaseClient, email: string): Promise<string> {
  const created = await client.auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  const { data, error } = await client.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found) throw created.error ?? new Error(`Could not create ${email}`);
  return found.id;
}

/** Inserts rows in chunks (PostgREST request size) and returns the inserted ids in order. */
async function insertAll(table: string, rows: object[]): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < rows.length; i += 500) {
    ids.push(...check(await db.from(table).insert(rows.slice(i, i + 500)).select("id")).map((r: { id: string }) => r.id));
  }
  return ids;
}

/** Random apartment numbers 1..total, `count` of them. */
function someApartments(total: number, count: number): number[] {
  const all = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count).sort((a, b) => a - b);
}

await wipe(db);
console.log("Wiped app data.");

// Buildings and apartments
const buildingIds = await insertAll("buildings", [...BUILDINGS, ...LEAD_BUILDINGS].map((b, i) => ({
  name: b.name, address: b.address, city: CITY, lat: b.lat, lng: b.lng,
  committee_name: b.committee, committee_phone: b.committeePhone, pipeline: b.pipeline,
  apartment_count: b.apartments, active: b.pipeline === "joined", created_at: daysAgo(130 - i * 18).toISOString(),
})));
const apartmentRows = BUILDINGS.flatMap((b, i) =>
  Array.from({ length: b.apartments }, (_, n) => ({ building_id: buildingIds[i], apartment_number: String(n + 1) })));
const apartmentIds = await insertAll("apartments", apartmentRows);
const apartmentId = (buildingIdx: number, number: number) =>
  apartmentIds[apartmentRows.findIndex((a) => a.building_id === buildingIds[buildingIdx] && a.apartment_number === String(number))];

// Businesses, branches, offers
const pinHash = hashPin(TERMINAL_PIN);
const businessRow = (name: string, category: string, address: string, n: number, extra: object) => ({
  name, category, address, city: CITY, contact_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
  phone: `05${String(30000000 + n * 7919).padStart(8, "0")}`, email: `biz${String(n).padStart(2, "0")}@${SEED_DOMAIN}`,
  pin_hash: pinHash, hours: HOURS, ...extra,
});
const businessIds = await insertAll("businesses", BUSINESSES.map((b, i) => businessRow(b.name, b.category, b.address, i + 1, {
  lat: b.lat, lng: b.lng, description: b.description, status: "active", commission_percent: b.commission ?? 5,
  agreed_terms_at: daysAgo(b.joinedDaysAgo).toISOString(), created_at: daysAgo(b.joinedDaysAgo).toISOString(),
})));
await insertAll("businesses", LEAD_BUSINESSES.map((b, i) => businessRow(b.name, b.category, b.address, 90 + i, {
  status: b.status, agreed_terms_at: now.toISOString(),
})));
await insertAll("branches", BUSINESSES.flatMap((b, i) => (b.branches ?? []).map((br) => ({
  business_id: businessIds[i], name: br.name, address: br.address, city: CITY, hours: HOURS,
}))));
const offerStart = (i: number) => {
  const { startsInDays } = BUSINESSES[i].offer;
  return startsInDays ? new Date(now.getTime() + startsInDays * DAY) : daysAgo(BUSINESSES[i].joinedDaysAgo);
};
const offerIds = await insertAll("offers", BUSINESSES.map((b, i) => ({
  business_id: businessIds[i], title: b.offer.title, description: b.offer.description, terms: b.offer.terms,
  discount_percent: b.offer.discount ?? 10, category: b.category,
  starts_at: offerStart(i).toISOString(), ends_at: b.offer.endsAt ? `${b.offer.endsAt}T23:59:59+02:00` : null,
  created_at: daysAgo(b.joinedDaysAgo).toISOString(), approved_at: daysAgo(b.joinedDaysAgo).toISOString(),
})));

// Residents: 12 per building, the first one is the committee member. SEED_RESIDENT_EMAIL becomes building 1's committee.
const plan: PlanApartment[] = [];
const residentIds: string[] = []; // indexed by PlanApartment.residentIdx
let n = 0;
for (const [bIdx, b] of BUILDINGS.entries()) {
  for (const [k, number] of someApartments(b.apartments, RESIDENTS_PER_BUILDING).entries()) {
    n++;
    const email = n === 1 && process.env.SEED_RESIDENT_EMAIL ? process.env.SEED_RESIDENT_EMAIL : `res${String(n).padStart(2, "0")}@${SEED_DOMAIN}`;
    const id = await ensureUser(db, email);
    const joined = daysAgo(Math.floor(random() * (110 - bIdx * 18)));
    check(await db.from("residents").upsert({
      id, name: `${FIRST_NAMES[(n - 1) % FIRST_NAMES.length]} ${pick(LAST_NAMES)}`, phone: `05${String(40000000 + n * 104729).padStart(8, "0")}`,
      apartment_id: apartmentId(bIdx, number), role: k === 0 ? "committee" : "resident", created_at: joined.toISOString(),
    }));
    // 15% of households never redeem; the rest vary.
    plan.push({ key: apartmentId(bIdx, number), residentIdx: residentIds.length, activity: random() < 0.15 ? 0 : 0.3 + random() * 0.7 });
    residentIds.push(id);
  }
}
console.log(`Created ${plan.length} residents.`);

// Account roles for the people who will click around the dev app.
if (process.env.ADMIN_EMAIL) {
  check(await db.from("user_roles").insert({ user_id: await ensureUser(db, process.env.ADMIN_EMAIL), role: "admin" }));
}
if (process.env.SEED_OWNER_EMAIL) {
  check(await db.from("user_roles").insert({ user_id: await ensureUser(db, process.env.SEED_OWNER_EMAIL), role: "business_owner", business_id: businessIds[0] }));
}

// Redemptions
const months = lastMonths(now, 3);
const planned = planRedemptions(plan, BUSINESSES.map((b, i) => ({
  discount: b.offer.discount ?? 10, commission: b.commission ?? 5, bill: b.bill, weight: b.weight, liveFrom: offerStart(i),
})), months, now, random);
const codesByBusiness = businessIds.map(() => new Set<string>());
/** A code not yet used by this business. */
function freshCode(businessIdx: number): string {
  let code = generateCode();
  while (codesByBusiness[businessIdx].has(code)) code = generateCode();
  codesByBusiness[businessIdx].add(code);
  return code;
}
await insertAll("redemptions", planned.map((r) => ({
  code: freshCode(r.businessIdx), apartment_id: r.apartmentKey, business_id: businessIds[r.businessIdx], offer_id: offerIds[r.businessIdx],
  resident_id: residentIds[r.residentIdx],
  status: r.status, period: r.period, issued_at: r.issuedAt.toISOString(), expires_at: r.expiresAt.toISOString(),
  redeemed_at: r.redeemedAt?.toISOString() ?? null, amount: r.amount, discount_amount: r.discountAmount, commission_amount: r.commissionAmount,
})));
console.log(`Created ${planned.length} redemptions over ${months.join(", ")}.`);

// Invoices for finished months: the oldest is paid, the rest open.
const invoices = months.slice(0, -1).flatMap((period, m) => businessIds.map((businessId, b) => {
  const total = planned.filter((r) => r.period === period && r.businessIdx === b && r.status === "redeemed")
    .reduce((sum, r) => sum + r.commissionAmount!, 0);
  const paid = m === 0;
  const [y, mo] = period.split("-").map(Number);
  return total === 0 ? null : {
    business_id: businessId, period, commission_total: Math.round(total * 100) / 100,
    issued_at: new Date(Date.UTC(y, mo, 1, 8)).toISOString(),
    status: paid ? "paid" : "open", paid_at: paid ? new Date(Date.UTC(y, mo, 10, 8)).toISOString() : null,
  };
}).filter((x) => x !== null));
await insertAll("invoices", invoices);

// Notes for the first business's three most frequent customers.
const visits = new Map<number, number>();
for (const r of planned) if (r.businessIdx === 0 && r.status === "redeemed") visits.set(r.residentIdx, (visits.get(r.residentIdx) ?? 0) + 1);
const regulars = [...visits].sort((a, b) => b[1] - a[1]).slice(0, 3);
const NOTES = [["לקוחה קבועה, אוהבת בלי בצל", ["VIP"]], ["מזמין תמיד משפחתית", ["משפחה גדולה"]], ["ביקש להזכיר על מבצע שישי", []]] as const;
await insertAll("customer_notes", regulars.map(([residentIdx], i) => ({
  business_id: businessIds[0], resident_id: residentIds[residentIdx],
  note: NOTES[i][0], tags: NOTES[i][1],
})));

console.log(`
Petah Tikva demo ready.
  Terminal PIN for every business: ${TERMINAL_PIN}
  Admin:           ${process.env.ADMIN_EMAIL ?? "(set ADMIN_EMAIL)"}
  Business owner:  ${process.env.SEED_OWNER_EMAIL ?? "(set SEED_OWNER_EMAIL)"} → ${BUSINESSES[0].name}
  Committee/resident: ${process.env.SEED_RESIDENT_EMAIL ?? "(set SEED_RESIDENT_EMAIL)"} → ${BUILDINGS[0].name}
`);
