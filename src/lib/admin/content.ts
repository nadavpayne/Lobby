import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BannerInput, NotificationInput } from "./validate";

export interface Banner extends BannerInput {
  id: string;
}

export interface AdminCategory {
  slug: string;
  name: string;
  icon: string;
  sort: number;
  active: boolean;
}

export interface SentNotification extends NotificationInput {
  id: string;
  createdAt: string;
  /** Building name when target = building. */
  buildingName: string | null;
}

/** Everything on the content screen: banners, categories, recent announcements. */
export interface ContentData {
  banners: Banner[];
  categories: AdminCategory[];
  notifications: SentNotification[];
}

interface BannerRow { id: string; title: string; subtitle: string | null; image_url: string | null; business_id: string | null; city: string | null; active: boolean; sort: number }

const toBanner = (r: BannerRow): Banner => ({ id: r.id, title: r.title, subtitle: r.subtitle, imageUrl: r.image_url, businessId: r.business_id, city: r.city, active: r.active, sort: r.sort });

/** Loads the content screen. */
export async function getContent(db: SupabaseClient): Promise<ContentData> {
  const [banners, categories, notifications] = await Promise.all([
    db.from("banners").select("id, title, subtitle, image_url, business_id, city, active, sort").order("sort"),
    db.from("categories").select("slug, name, icon, sort, active").order("sort"),
    db.from("notifications").select("id, title, body, target, city, building_id, created_at, buildings(name, address)").order("created_at", { ascending: false }).limit(30),
  ]);
  for (const r of [banners, categories, notifications]) if (r.error) throw r.error;
  return {
    banners: (banners.data as BannerRow[]).map(toBanner),
    categories: categories.data as AdminCategory[],
    notifications: (notifications.data as unknown as {
      id: string; title: string; body: string; target: NotificationInput["target"]; city: string | null; building_id: string | null; created_at: string;
      buildings: { name: string | null; address: string } | null;
    }[]).map((n) => ({
      id: n.id, title: n.title, body: n.body, target: n.target, city: n.city, buildingId: n.building_id, createdAt: n.created_at,
      buildingName: n.buildings ? (n.buildings.name ?? n.buildings.address) : null,
    })),
  };
}

/** Creates a banner, or edits one. */
export async function saveBanner(db: SupabaseClient, b: BannerInput, id?: string): Promise<boolean> {
  const fields = { title: b.title, subtitle: b.subtitle, image_url: b.imageUrl, business_id: b.businessId, city: b.city, active: b.active, sort: b.sort };
  const { data, error } = await (id ? db.from("banners").update(fields).eq("id", id) : db.from("banners").insert(fields)).select("id").maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Deletes a banner. */
export async function deleteBanner(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("banners").delete().eq("id", id);
  if (error) throw error;
}

/** Renames, reorders or hides a category (its key and icon stay). */
export async function updateCategory(db: SupabaseClient, slug: string, name: string, sort: number, active: boolean): Promise<boolean> {
  const { data, error } = await db.from("categories").update({ name, sort, active }).eq("slug", slug).select("slug").maybeSingle();
  if (error) throw error;
  return data !== null;
}

/**
 * Records an announcement; residents in the target see it on the building tab.
 * shortcut: in-app only; send it as a native push too once the Capacitor app has device tokens (devices table).
 */
export async function sendNotification(db: SupabaseClient, n: NotificationInput, userId: string): Promise<void> {
  const { error } = await db.from("notifications").insert({ title: n.title, body: n.body, target: n.target, city: n.city, building_id: n.buildingId, created_by: userId });
  if (error) throw error;
}
