import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "./membership";

/** A Lobby announcement as residents see it. */
export interface ResidentNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

const LIMIT = 10;

/** The latest announcements for the member: sent to everyone, to their city, or to their building. */
export async function listMemberNotifications(db: SupabaseClient, m: Membership): Promise<ResidentNotification[]> {
  if (m.building.isDemo) return [];
  const { data, error } = await db
    .from("notifications")
    .select("id, title, body, target, city, building_id, created_at")
    // Values come from our own DB row (city name, uuid), quoted so commas or spaces can't break the or() filter.
    .or(`target.eq.all,and(target.eq.city,city.eq."${m.building.city.replace(/"/g, "")}"),building_id.eq.${m.building.id}`)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (error) throw error;
  return data.map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.created_at }));
}
