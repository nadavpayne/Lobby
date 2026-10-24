export interface BuildingData {
  address: string;
  city: string;
  apartmentCount: number;
  name: string;
  apartmentNumber: number;
}

export type BuildingField = keyof BuildingData;
export type BuildingErrors = Partial<Record<BuildingField, string>>;
export type BuildingResult = { ok: true; data: BuildingData } | { ok: false; errors: BuildingErrors };

const MAX_APARTMENTS = 500;

/** Trimmed string with inner whitespace collapsed, or "" for non-strings. */
const clean = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

/** Validates the committee's building registration; returns clean data or a Hebrew error per field. */
export function validateBuilding(raw: unknown): BuildingResult {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: BuildingErrors = {};

  const address = clean(body.address);
  if (!address) errors.address = "נא למלא רחוב ומספר בית";
  else if (address.length > 120) errors.address = "כתובת ארוכה מדי";

  const city = clean(body.city);
  if (!city) errors.city = "נא למלא עיר";
  else if (city.length > 40) errors.city = "שם עיר ארוך מדי";

  const name = clean(body.name);
  if (!name) errors.name = "נא למלא את שמך";
  else if (name.length > 60) errors.name = "שם ארוך מדי";

  const apartmentCount = Number(body.apartmentCount);
  if (!Number.isInteger(apartmentCount) || apartmentCount < 1 || apartmentCount > MAX_APARTMENTS) {
    errors.apartmentCount = `מספר הדירות חייב להיות בין 1 ל-${MAX_APARTMENTS}`;
  }

  const apartmentNumber = Number(body.apartmentNumber);
  if (!Number.isInteger(apartmentNumber) || apartmentNumber < 1 || (!errors.apartmentCount && apartmentNumber > apartmentCount)) {
    errors.apartmentNumber = "מספר הדירה שלך חייב להיות בין 1 למספר הדירות בבניין";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { address, city, apartmentCount, name, apartmentNumber } };
}
