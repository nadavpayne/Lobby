import { CATEGORIES, SUBCATEGORIES, TAGS, type Category } from "./categories.ts";

export interface JoinData {
  name: string;
  category: Category;
  /** 1–2 subcategory IDs of the primary category (none when it has no subcategories). */
  subcategories: string[];
  /** Tag IDs, any number. */
  tags: string[];
  address: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  discountPercent: number;
  description: string;
  terms: string | null;
}

export type JoinField = keyof JoinData | "acceptTerms";
export type JoinErrors = Partial<Record<JoinField, string>>;
export type JoinResult = { ok: true; data: JoinData } | { ok: false; errors: JoinErrors };

/** Trimmed string value, or "" for anything that isn't a string. */
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Unique string IDs from a form value (a single string or an array). */
const ids = (v: unknown) => [...new Set((Array.isArray(v) ? v : v === undefined ? [] : [v]).filter((x): x is string => typeof x === "string" && x !== ""))];

/** Normalizes an Israeli phone number to local form (e.g. 0521234567), or null if invalid. */
export function normalizeIsraeliPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/^\+972/, "0");
  return /^0\d{8,9}$/.test(digits) ? digits : null;
}

/** Validates the business onboarding payload; returns clean data or a Hebrew error per field. */
export function validateJoin(raw: unknown): JoinResult {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: JoinErrors = {};

  const text = (field: keyof JoinData, label: string, max: number, required = true) => {
    const value = str(body[field]);
    if (required && !value) errors[field] = `נא למלא ${label}`;
    else if (value.length > max) errors[field] = `${label}: עד ${max} תווים`;
    return value;
  };

  const name = text("name", "שם העסק", 80);
  const address = text("address", "כתובת", 120);
  const city = text("city", "עיר", 40);
  const contactName = text("contactName", "שם איש הקשר", 60);
  const description = text("description", "תיאור ההטבה", 200);
  const terms = text("terms", "תנאי ההטבה", 500, false);

  const category = str(body.category);
  if (!Object.hasOwn(CATEGORIES, category)) errors.category = "נא לבחור קטגוריה";

  const subcategories = ids(body.subcategories);
  const allowed = Object.hasOwn(SUBCATEGORIES, category) ? SUBCATEGORIES[category].map((s) => s.id) : [];
  if (!errors.category) {
    if (subcategories.some((id) => !allowed.includes(id))) errors.subcategories = "תת-קטגוריה לא מתאימה לקטגוריה שנבחרה";
    else if (allowed.length > 0 && (subcategories.length < 1 || subcategories.length > 2)) errors.subcategories = "נא לבחור תת-קטגוריה אחת או שתיים";
  }

  const tags = ids(body.tags);
  if (tags.some((id) => !TAGS.some((t) => t.id === id))) errors.tags = "תגית לא מוכרת";

  const phone = normalizeIsraeliPhone(str(body.phone));
  if (!phone) errors.phone = "מספר טלפון לא תקין";

  const email = str(body.email).toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "כתובת אימייל לא תקינה";

  const discountPercent = Number(body.discountPercent ?? 10);
  // 10% is the default; each business may agree a different rate.
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 50) {
    errors.discountPercent = "ההנחה חייבת להיות בין 1% ל-50%";
  }

  if (body.acceptTerms !== true) errors.acceptTerms = "יש לאשר את תנאי ההצטרפות";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name, address, city, contactName, description, discountPercent, email,
      category, subcategories, tags,
      phone: phone!,
      terms: terms || null,
    },
  };
}
