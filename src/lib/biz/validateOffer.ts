import { CATEGORIES } from "../businesses/categories.ts";
import type { OfferInput } from "./types.ts";

export type OfferErrors = Partial<Record<keyof OfferInput, string>>;
export type OfferValidation = { ok: true; data: OfferInput } | { ok: false; errors: OfferErrors };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Trimmed string or null when empty / not a string. */
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Checks an offer form (server and client use the same rules). */
export function validateOffer(raw: unknown): OfferValidation {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: OfferErrors = {};
  const title = text(r.title);
  const description = text(r.description);
  const terms = text(r.terms);
  const discountPercent = Number(r.discountPercent);
  const category = text(r.category);
  const startsOn = text(r.startsOn);
  const endsOn = text(r.endsOn);

  if (!title || title.length < 3 || title.length > 60) errors.title = "כותרת של 3–60 תווים, למשל „10% הנחה על כל התפריט”";
  if (!description || description.length > 300) errors.description = "תיאור קצר, עד 300 תווים";
  if (terms && terms.length > 300) errors.terms = "עד 300 תווים";
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 100) errors.discountPercent = "אחוז הנחה שלם בין 1 ל-100";
  if (!category || !(category in CATEGORIES)) errors.category = "בחרו קטגוריה";
  if (startsOn && !DAY.test(startsOn)) errors.startsOn = "תאריך לא תקין";
  if (endsOn && !DAY.test(endsOn)) errors.endsOn = "תאריך לא תקין";
  if (startsOn && endsOn && endsOn < startsOn) errors.endsOn = "תאריך הסיום לפני תאריך ההתחלה";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { title: title!, description: description!, terms, discountPercent, category: category!, startsOn, endsOn } };
}

const offsetFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", timeZoneName: "shortOffset" });

/** Israel's UTC offset on a day, e.g. "+03:00" in summer, "+02:00" in winter. */
function israelOffset(day: string): string {
  const name = offsetFormat.formatToParts(new Date(`${day}T12:00:00Z`)).find((p) => p.type === "timeZoneName")!.value; // "GMT+3"
  const hours = Number(name.replace("GMT", "") || 0);
  return `${hours >= 0 ? "+" : "-"}${String(Math.abs(hours)).padStart(2, "0")}:00`;
}

/** Start of a day in Israel as an ISO timestamp (offers start at local midnight). */
export const startOfIsraelDay = (day: string) => `${day}T00:00:00${israelOffset(day)}`;

/** End of a day in Israel (offers run through the whole last day). */
export const endOfIsraelDay = (day: string) => `${day}T23:59:59${israelOffset(day)}`;

const israelDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });

/** The Israel calendar day of a timestamp, for filling date inputs back in. */
export const toIsraelDay = (iso: string | null) => (iso ? israelDay.format(new Date(iso)) : null);
