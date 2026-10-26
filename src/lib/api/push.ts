import type { NotificationPrefs } from "@/lib/push/prefs";
import { apiFetch } from "./http";

/** Saves this device's push token for my account. */
export const registerPushToken = (token: string, pushToken: string, platform: string) =>
  apiFetch<{ ok: true }>("/api/push", { token, body: { action: "register", token: pushToken, platform } });

/** Forgets this device's push token (sign-out). */
export const unregisterPushToken = (token: string, pushToken: string) =>
  apiFetch<{ ok: true }>("/api/push", { token, body: { action: "unregister", token: pushToken } });

/** My notification switches. */
export const fetchPushPrefs = (token: string) => apiFetch<NotificationPrefs>("/api/push", { token });

/** Saves some switches; returns all of them. */
export const savePushPrefs = (token: string, prefs: Partial<NotificationPrefs>) =>
  apiFetch<NotificationPrefs>("/api/push", { token, body: { action: "prefs", prefs } });
