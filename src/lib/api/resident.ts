import type { ResidentNotification } from "@/lib/buildings/notifications";
import type { CodeHistory, Feed } from "@/lib/offers/types";
import type { IssuedToken, TokenStatus } from "@/lib/qr/types";
import { apiFetch } from "./http";

/** My building's feed: offers with this month's state, categories, savings. */
export const fetchFeed = (token: string) => apiFetch<Feed>("/api/me/offers", { token });

/** A fresh 5-minute QR + backup code for a business (replaces my apartment's previous one there). */
export const issueToken = (token: string, businessId: string) => apiFetch<IssuedToken>("/api/me/tokens", { token, body: { businessId } });

/** Where my QR stands (polled while it is on screen, to move to the Done screen when the register approves it). */
export const fetchTokenStatus = (token: string, tokenId: string) => apiFetch<TokenStatus>(`/api/me/tokens/${tokenId}`, { token });

/** My apartment's redemptions ("my benefits") and savings. */
export const fetchCodeHistory = (token: string) => apiFetch<CodeHistory>("/api/me/codes", { token });

/** Lobby announcements for my building, city or everyone. */
export const fetchNotifications = (token: string) => apiFetch<ResidentNotification[]>("/api/me/notifications", { token });
