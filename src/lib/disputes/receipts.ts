import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { detectImage } from "@/lib/images/detectImage";
import { RECEIPT_URL_SECONDS } from "./config";

const BUCKET = "dispute-receipts"; // private: only signed URLs, never public links
const MAX_BYTES = 5 * 1024 * 1024;

/** Checks and stores an optional receipt photo for a redemption: its storage key, null if none was sent, or an error. */
export async function storeReceipt(db: SupabaseClient, redemptionId: string, file: unknown): Promise<{ key: string | null } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { key: null };
  if (file.size > MAX_BYTES) return { error: "התמונה גדולה מדי (עד 5MB)" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImage(bytes);
  if (!type) return { error: "אפשר לצרף רק תמונה (JPG, PNG או WebP)" };
  const key = `${redemptionId}/${crypto.randomUUID()}.${type.ext}`;
  const up = await db.storage.from(BUCKET).upload(key, bytes, { contentType: type.mime, upsert: false });
  if (up.error) throw up.error;
  return { key };
}

/** Removes a stored receipt (when the dispute that would own it couldn't be saved). Best effort. */
export async function removeReceipt(db: SupabaseClient, key: string): Promise<void> {
  await db.storage.from(BUCKET).remove([key]);
}

/** A short-lived link to a receipt photo, for the admin only. */
export async function receiptUrl(db: SupabaseClient, key: string | null): Promise<string | null> {
  if (!key) return null;
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(key, RECEIPT_URL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
