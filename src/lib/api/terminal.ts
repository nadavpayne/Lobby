import type { BusinessInfo } from "@/lib/businesses/types";
import type { RedeemResult, VerifyResult } from "@/lib/redemptions/types";
import { apiFetch } from "./http";

// Client calls for the business verification terminal (/b/[access_slug]).

/** Exchanges access link + PIN for a device token. */
export const loginTerminal = (accessSlug: string, pin: string) =>
  apiFetch<{ token: string; business: BusinessInfo }>("/api/business/login", { body: { accessSlug, pin } });

/** Current name/status of the business behind a stored token. */
export const fetchBusiness = (token: string) => apiFetch<BusinessInfo>("/api/business/me", { token });

/** Checks a resident's code. */
export const verifyCode = (token: string, code: string) =>
  apiFetch<VerifyResult>("/api/business/verify", { token, body: { code } });

/** Demo business only: makes the demo code valid again. */
export const resetDemo = (token: string) => apiFetch<{ ok: true }>("/api/business/demo-reset", { token, body: {} });

/** Confirms a redemption with the full pre-discount bill. */
export const redeemCode = (token: string, code: string, amount: number) =>
  apiFetch<RedeemResult>("/api/business/redeem", { token, body: { code, amount } });
