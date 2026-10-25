import type { RedeemResult, VerifyResult } from "@/lib/redemptions/types";
import { apiFetch, type ApiError } from "./http";

/** The two calls the register screens make, bound to whoever is signed in. */
export interface RedeemApi {
  verify: (code: string) => Promise<VerifyResult | ApiError>;
  redeem: (code: string, amount: number) => Promise<RedeemResult | ApiError>;
}

/** Staff terminal (/b/[slug]): PIN device token, /api/business/*. */
export const terminalRedeemApi = (token: string): RedeemApi => ({
  verify: (code) => apiFetch<VerifyResult>("/api/business/verify", { token, body: { code } }),
  redeem: (code, amount) => apiFetch<RedeemResult>("/api/business/redeem", { token, body: { code, amount } }),
});

/** Business owner app (/biz/scan): account session, /api/biz/*. */
export const ownerRedeemApi = (token: string): RedeemApi => ({
  verify: (code) => apiFetch<VerifyResult>("/api/biz/verify", { token, body: { code } }),
  redeem: (code, amount) => apiFetch<RedeemResult>("/api/biz/redeem", { token, body: { code, amount } }),
});
