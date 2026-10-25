import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { detectImage } from "@/lib/images/detectImage";

const BUCKET = "business-logos";
const MAX_BYTES = 5 * 1024 * 1024;

export type LogoOutcome = { ok: true; logoUrl: string } | { ok: false; error: string };

/** The object path inside our bucket for a public logo URL, or null if the URL isn't one of ours. */
function pathOf(url: string | null): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  return url?.includes(marker) ? url.slice(url.indexOf(marker) + marker.length) : null;
}

/**
 * Stores a new logo for the business (checked by its bytes: JPEG, PNG or WebP up to 5 MB), points logo_url at it and
 * deletes the previous one. The file name is random, so a changed logo never shows a cached old one.
 */
export async function saveLogo(db: SupabaseClient, businessId: string, file: File): Promise<LogoOutcome> {
  if (file.size === 0 || file.size > MAX_BYTES) return { ok: false, error: "התמונה גדולה מדי (עד 5MB)" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImage(bytes);
  if (!type) return { ok: false, error: "אפשר להעלות רק תמונה (JPG, PNG או WebP)" };

  const path = `${businessId}/logo-${crypto.randomUUID()}.${type.ext}`;
  const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
  if (up.error) throw up.error;
  const logoUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const { data: before, error } = await db.from("businesses").select("logo_url").eq("id", businessId).single<{ logo_url: string | null }>();
  if (error) throw error;
  const saved = await db.from("businesses").update({ logo_url: logoUrl }).eq("id", businessId);
  if (saved.error) throw saved.error;

  const old = pathOf(before.logo_url);
  if (old?.startsWith(`${businessId}/`)) await db.storage.from(BUCKET).remove([old]); // best effort; a leftover file is harmless
  return { ok: true, logoUrl };
}
