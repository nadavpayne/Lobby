import type { ApproveResult, ScanResult } from "@/lib/qr/types";
import { apiFetch, type ApiError } from "./http";

/** The register's two calls, bound to whoever is signed in. */
export interface RegisterApi {
  scan: (code: string) => Promise<ScanResult | ApiError>;
  approve: (scanId: string, amount: string) => Promise<ApproveResult | ApiError>;
}

/** Staff PIN terminal (/b/[slug]): device token, /api/business/*. */
export const terminalRegister = (token: string): RegisterApi => ({
  scan: (code) => apiFetch<ScanResult>("/api/business/scan", { token, body: { code } }),
  approve: (scanId, amount) => apiFetch<ApproveResult>("/api/business/approve", { token, body: { scanId, amount } }),
});

/** Owner or cashier account (/biz/scan, /cashier): /api/biz/*. */
export const accountRegister = (token: string): RegisterApi => ({
  scan: (code) => apiFetch<ScanResult>("/api/biz/scan", { token, body: { code } }),
  approve: (scanId, amount) => apiFetch<ApproveResult>("/api/biz/approve", { token, body: { scanId, amount } }),
});
