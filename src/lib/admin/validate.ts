import { CATEGORIES } from "../businesses/categories.ts";
import { normalizeIsraeliPhone } from "../businesses/validateJoin.ts";

// Admin form checks (server and client use the same rules). Each returns cleaned data or Hebrew errors per field.

export type Result<T> = { ok: true; data: T } | { ok: false; errors: Partial<Record<keyof T, string>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed string or null when empty / not a string. */
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Wraps collected errors into a Result. */
function result<T>(errors: Partial<Record<keyof T, string>>, data: () => T): Result<T> {
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: data() };
}

export type BuildingStage = "lead" | "contacted" | "joined";
export const BUILDING_STAGES: BuildingStage[] = ["lead", "contacted", "joined"];

export interface BuildingLead {
  name: string | null;
  address: string;
  city: string;
  committeeName: string | null;
  committeePhone: string | null;
  apartmentCount: number;
  pipeline: BuildingStage;
  /** The address picked from the list (when address lookup is on); the server resolves it. */
  placeId?: string;
}

/** A building in the committee pipeline (new lead or edit). */
export function validateBuildingLead(raw: unknown): Result<BuildingLead> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<keyof BuildingLead, string>> = {};
  const address = text(r.address);
  const city = text(r.city);
  const phoneText = text(r.committeePhone);
  const committeePhone = phoneText ? normalizeIsraeliPhone(phoneText) : null;
  const apartmentCount = Number(r.apartmentCount);
  const pipeline = r.pipeline as BuildingStage;
  if (!address) errors.address = "כתובת";
  if (!city) errors.city = "עיר";
  if (phoneText && !committeePhone) errors.committeePhone = "טלפון ישראלי";
  if (!Number.isInteger(apartmentCount) || apartmentCount < 1 || apartmentCount > 500) errors.apartmentCount = "מספר דירות 1–500";
  if (!BUILDING_STAGES.includes(pipeline)) errors.pipeline = "שלב לא תקין";
  return result(errors, () => ({ name: text(r.name), address: address!, city: city!, committeeName: text(r.committeeName), committeePhone, apartmentCount, pipeline, placeId: text(r.placeId) ?? undefined }));
}

export interface BusinessLead {
  name: string;
  category: string;
  address: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  /** The address picked from the list (when address lookup is on); the server resolves it. */
  placeId?: string;
}

/** A business the operator adds by hand as a sales lead. */
export function validateBusinessLead(raw: unknown): Result<BusinessLead> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<keyof BusinessLead, string>> = {};
  const [name, category, address, city, contactName, email] = [r.name, r.category, r.address, r.city, r.contactName, r.email].map(text);
  const phone = normalizeIsraeliPhone(text(r.phone) ?? "");
  if (!name) errors.name = "שם העסק";
  if (!category || !(category in CATEGORIES)) errors.category = "קטגוריה";
  if (!address) errors.address = "כתובת";
  if (!city) errors.city = "עיר";
  if (!contactName) errors.contactName = "איש קשר";
  if (!phone) errors.phone = "טלפון ישראלי";
  if (!email || !EMAIL.test(email)) errors.email = "אימייל";
  return result(errors, () => ({ name: name!, category: category!, address: address!, city: city!, contactName: contactName!, phone: phone!, email: email!.toLowerCase(), placeId: text(r.placeId) ?? undefined }));
}

/** Commission override for a business's contract: 0–100, up to 2 decimals. */
export function validateCommission(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 && Math.round(n * 100) === n * 100 ? n : null;
}

export interface BannerInput {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  businessId: string | null;
  /** null = every city. */
  city: string | null;
  active: boolean;
  sort: number;
}

/** A hero banner for the resident home screen. */
export function validateBanner(raw: unknown): Result<BannerInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<keyof BannerInput, string>> = {};
  const title = text(r.title);
  const subtitle = text(r.subtitle);
  const imageUrl = text(r.imageUrl);
  const businessId = text(r.businessId);
  const sort = Number(r.sort ?? 0);
  if (!title || title.length > 60) errors.title = "כותרת עד 60 תווים";
  if (subtitle && subtitle.length > 120) errors.subtitle = "עד 120 תווים";
  if (imageUrl && !/^https:\/\/\S+$/.test(imageUrl)) errors.imageUrl = "קישור שמתחיל ב-https://";
  if (businessId && !UUID.test(businessId)) errors.businessId = "עסק לא תקין";
  if (!Number.isInteger(sort) || sort < 0 || sort > 999) errors.sort = "מספר 0–999";
  return result(errors, () => ({ title: title!, subtitle, imageUrl, businessId, city: text(r.city), active: r.active !== false, sort }));
}

export interface NotificationInput {
  title: string;
  body: string;
  target: "all" | "city" | "building";
  city: string | null;
  buildingId: string | null;
}

/** A Lobby announcement to everyone, one city or one building. */
export function validateNotification(raw: unknown): Result<NotificationInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<keyof NotificationInput, string>> = {};
  const title = text(r.title);
  const body = text(r.body);
  const target = r.target as NotificationInput["target"];
  const city = target === "city" ? text(r.city) : null;
  const buildingId = target === "building" ? text(r.buildingId) : null;
  if (!title || title.length > 60) errors.title = "כותרת עד 60 תווים";
  if (!body || body.length > 300) errors.body = "הודעה עד 300 תווים";
  if (!["all", "city", "building"].includes(target)) errors.target = "למי לשלוח";
  if (target === "city" && !city) errors.city = "בחרו עיר";
  if (target === "building" && (!buildingId || !UUID.test(buildingId))) errors.buildingId = "בחרו בניין";
  return result(errors, () => ({ title: title!, body: body!, target, city, buildingId }));
}
