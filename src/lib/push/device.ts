"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { registerPushToken, unregisterPushToken } from "@/lib/api/push";
import { native } from "@/lib/native";

const KEY = "lobby.pushToken";
const DISMISSED = "lobby.pushPromptDismissed";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the token is simply registered again next launch
  }
};

/** Asks iOS for permission (only after our own explanation screen) and saves the device token for this account. */
export async function enablePush(authToken: string): Promise<boolean> {
  const reg = await native.push.register();
  if (!reg) return false;
  write(KEY, reg.token);
  await registerPushToken(authToken, reg.token, reg.platform);
  return true;
}

/** Already allowed: refreshes this device's token for whoever is signed in (tokens can change, accounts can switch). */
export async function syncPush(authToken: string): Promise<void> {
  if ((await native.push.permission()) === "granted") await enablePush(authToken);
}

/** Before signing out: this device stops getting this account's notifications. */
export async function forgetPush(authToken: string): Promise<void> {
  const token = read(KEY);
  if (!token) return;
  write(KEY, null);
  await unregisterPushToken(authToken, token);
}

/** Signs out of this device, after making sure it stops getting this account's notifications. */
export async function signOutDevice(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) await forgetPush(data.session.access_token).catch(() => {});
  await supabase.auth.signOut();
}

/** Show our explanation screen? Only in the app, before iOS has been asked, and until the user says "not now". */
export async function shouldPromptPush(): Promise<boolean> {
  return native.isApp && !read(DISMISSED) && (await native.push.permission()) === "prompt";
}

/** "Not now": don't show the explanation screen again on this device. */
export const dismissPushPrompt = () => write(DISMISSED, "1");
