import type { CodeHistory, Feed, IssuedCode } from "@/lib/offers/types";
import { apiFetch } from "./http";

/** My building's feed: offers with this month's state, categories, savings. */
export const fetchFeed = (token: string) => apiFetch<Feed>("/api/me/offers", { token });

/** Gets (or re-shows) my apartment's code for a business. */
export const requestCode = (token: string, businessId: string) => apiFetch<IssuedCode>("/api/me/codes", { token, body: { businessId } });

/** My apartment's codes and savings. */
export const fetchCodeHistory = (token: string) => apiFetch<CodeHistory>("/api/me/codes", { token });
