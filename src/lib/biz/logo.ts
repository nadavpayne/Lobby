import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { detectImage, type ImageType } from "@/lib/images/detectImage";

const BUCKET = "business-logos";
const MAX_BYTES = 5 * 1024 * 1024;

export type LogoOutcome = { ok: true; logoUrl: string } | { ok: false; error: string };
export type CheckedLogo = { ok: true; bytes: Uint8Array; type: ImageType } | { ok: false; error: string };

/** The object path inside our bucket for a public logo URL, or null if the URL isn't one of ours. */
function pathOf(url: string | null): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  return url?.includes(marker) ? url.slice(url.indexOf(marker) + marker.length) : null;
}

/** Checks an uploaded logo before anything is saved: present, up to 5 MB, and really a JPEG/PNG/WebP by its bytes. */
export async function checkLogo(file: unknown): Promise<CheckedLogo> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "צריך להעלות את הלוגו של העסק" };
  if (file.size > MAX_BYTES) return { ok: false, error: "התמונה גדולה מדי (עד 5MB)" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImage(bytes);
  return type ? { ok: true, bytes, type } : { ok: false, error: "אפשר להעלות רק תמונה (JPG, PNG או WebP)" };
}

/**
 * Stores a checked logo for the business under a random name (a new logo never shows a cached old one), points
 * logo_url at it and deletes the previous one. Returns the public URL.
 */
export async function storeLogo(db: SupabaseClient, businessId: string, logo: Extract<CheckedLogo, { ok: true }>): Promise<string> {
  const path = `${businessId}/logo-${crypto.randomUUID()}.${logo.type.ext}`;
  const up = await db.storage.from(BUCKET).upload(path, logo.bytes, { contentType: logo.type.mime, cacheControl: "31536000", upsert: false });
  if (up.error) throw up.error;
  const logoUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const { data: before, error } = await db.from("businesses").select("logo_url").eq("id", businessId).single<{ logo_url: string | null }>();
  if (error) throw error;
  const saved = await db.from("businesses").update({ logo_url: logoUrl }).eq("id", businessId);
  if (saved.error) throw saved.error;

  const old = pathOf(before.logo_url);
  if (old?.startsWith(`${businessId}/`)) await db.storage.from(BUCKET).remove([old]); // best effort; a leftover file is harmless
  return logoUrl;
}

/** Owner's logo change from the business area: check, then store. */
export async function saveLogo(db: SupabaseClient, businessId: string, file: unknown): Promise<LogoOutcome> {
  const logo = await checkLogo(file);
  if (!logo.ok) return logo;
  return { ok: true, logoUrl: await storeLogo(db, businessId, logo) };
}
