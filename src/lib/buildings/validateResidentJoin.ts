export interface ResidentJoinData {
  name: string;
  apartmentNumber: number;
}

export type ResidentJoinErrors = Partial<Record<keyof ResidentJoinData, string>>;
export type ResidentJoinResult = { ok: true; data: ResidentJoinData } | { ok: false; errors: ResidentJoinErrors };

/** Validates a resident's name and apartment (1..apartmentCount); returns clean data or Hebrew errors. */
export function validateResidentJoin(raw: unknown, apartmentCount: number): ResidentJoinResult {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: ResidentJoinErrors = {};

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (!name) errors.name = "נא למלא שם";
  else if (name.length > 60) errors.name = "שם ארוך מדי";

  const apartmentNumber = Number(body.apartmentNumber);
  if (!Number.isInteger(apartmentNumber) || apartmentNumber < 1 || apartmentNumber > apartmentCount) {
    errors.apartmentNumber = `מספר דירה בין 1 ל-${apartmentCount}`;
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: { name, apartmentNumber } };
}
