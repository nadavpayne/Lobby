import { normalizeIsraeliPhone } from "../businesses/validateJoin.ts";
import type { DayKey, WeekHours } from "../offers/hours.ts";
import type { Branch, ProfileInput } from "./types.ts";

export type ProfileErrors = Partial<Record<keyof ProfileInput, string>>;
export type ProfileValidation = { ok: true; data: ProfileInput } | { ok: false; errors: ProfileErrors };

const DAYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_BRANCHES = 10;

/** Trimmed string or null when empty / not a string. */
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Opening hours: per day up to 2 ranges of "HH:MM" with from < to; null if malformed. */
export function cleanHours(raw: unknown): WeekHours | null {
  if (typeof raw !== "object" || raw === null) return null;
  const out: WeekHours = {};
  for (const day of DAYS) {
    const ranges = (raw as Record<string, unknown>)[day] ?? [];
    if (!Array.isArray(ranges) || ranges.length > 2) return null;
    for (const r of ranges) {
      if (!Array.isArray(r) || r.length !== 2 || !TIME.test(r[0]) || !TIME.test(r[1]) || r[0] >= r[1]) return null;
    }
    out[day] = ranges as [string, string][];
  }
  return out;
}

/** Checks the business profile form (server and client use the same rules). */
export function validateProfile(raw: unknown): ProfileValidation {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: ProfileErrors = {};
  const description = text(r.description);
  const phone = normalizeIsraeliPhone(text(r.phone) ?? "");
  const address = text(r.address);
  const hours = cleanHours(r.hours);
  const branches: Branch[] = Array.isArray(r.branches)
    ? r.branches.map((b) => ({ name: text(b?.name) ?? "", address: text(b?.address) ?? "", placeId: text(b?.placeId) ?? undefined })).filter((b) => b.name || b.address)
    : [];

  if (description && description.length > 400) errors.description = "עד 400 תווים";
  if (!phone) errors.phone = "מספר טלפון ישראלי";
  if (!address || address.length > 120) errors.address = "כתובת העסק";
  if (!hours) errors.hours = "שעות לא תקינות: שעת סגירה אחרי שעת פתיחה";
  if (branches.length > MAX_BRANCHES || branches.some((b) => !b.name || !b.address || b.name.length > 60 || b.address.length > 120)) {
    errors.branches = "לכל סניף צריך שם וכתובת";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const pin = typeof r.pin === "object" && r.pin !== null ? (r.pin as { lat: number; lng: number }) : null; // range-checked on the server
  return { ok: true, data: { description, phone: phone!, address: address!, hours: hours!, branches, placeId: text(r.placeId) ?? undefined, pin } };
}

/** A staff terminal PIN: exactly 4 digits (same rule as at sign-up). */
export const isValidPin = (pin: unknown): pin is string => typeof pin === "string" && /^\d{4}$/.test(pin);
