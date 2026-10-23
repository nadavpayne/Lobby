import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyPin } from "@/lib/pin";
import { isRateLimited, recordFailure } from "./attempts";
import { createBusinessToken, isBusinessTokenValid, readBusinessId } from "./token";
import type { BusinessInfo, BusinessStatus } from "./types";

export interface Business {
  id: string;
  name: string;
  status: BusinessStatus;
  pin_hash: string;
  is_demo: boolean;
}

/** The public view of a business for the terminal. */
export const toBusinessInfo = (b: Business): BusinessInfo => ({ name: b.name, status: b.status, isDemo: b.is_demo });

export type LoginOutcome =
  | { ok: true; token: string; business: BusinessInfo }
  | { ok: false; reason: "not_found" | "rate_limited" | "wrong_pin" };

const BUSINESS_COLUMNS = "id, name, status, pin_hash, is_demo";

/** Server secret that signs business device tokens. */
function tokenSecret(): string {
  const secret = process.env.BUSINESS_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error("BUSINESS_TOKEN_SECRET must be set (32+ chars)");
  return secret;
}

/** Checks access_slug + PIN (rate-limited per business) and issues a device token. */
export async function loginBusiness(db: SupabaseClient, accessSlug: unknown, pin: unknown): Promise<LoginOutcome> {
  if (typeof accessSlug !== "string" || !/^[0-9a-f]{32}$/.test(accessSlug)) return { ok: false, reason: "not_found" };

  const { data: business, error } = await db
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .eq("access_slug", accessSlug)
    .maybeSingle<Business>();
  if (error) throw error;
  if (!business) return { ok: false, reason: "not_found" };

  if (await isRateLimited(db, business.id, "pin")) return { ok: false, reason: "rate_limited" };
  if (typeof pin !== "string" || !verifyPin(pin, business.pin_hash)) {
    await recordFailure(db, business.id, "pin");
    return { ok: false, reason: "wrong_pin" };
  }

  return {
    ok: true,
    token: createBusinessToken(business.id, business.pin_hash, tokenSecret()),
    business: toBusinessInfo(business),
  };
}

/** The business behind the request's "Authorization: Bearer" token, or null if missing/invalid. */
export async function getBusinessFromRequest(db: SupabaseClient, request: Request): Promise<Business | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const businessId = token && readBusinessId(token);
  if (!token || !businessId) return null;

  const { data: business, error } = await db
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .eq("id", businessId)
    .maybeSingle<Business>();
  if (error) throw error;
  return business && isBusinessTokenValid(token, business.pin_hash, tokenSecret()) ? business : null;
}
