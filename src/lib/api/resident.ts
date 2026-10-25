import type { CodeHistory, IssuedCode, ResidentOffer } from "@/lib/offers/types";
import { apiFetch } from "./http";

/** Offers for my building with this month's state. */
export const fetchOffers = (token: string) => apiFetch<ResidentOffer[]>("/api/me/offers", { token });

/** Gets (or re-shows) my apartment's code for a business. */
export const requestCode = (token: string, businessId: string) => apiFetch<IssuedCode>("/api/me/codes", { token, body: { businessId } });

/** My apartment's codes and savings. */
export const fetchCodeHistory = (token: string) => apiFetch<CodeHistory>("/api/me/codes", { token });
