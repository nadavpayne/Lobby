// Notification types and each account's on/off switches. Pure.

export type NotificationType = "new_benefits" | "redemptions" | "disputes" | "biz_summary";

export type NotificationPrefs = Record<NotificationType, boolean>;

/** No saved row = these. The business summary is opt-in. */
export const DEFAULT_PREFS: NotificationPrefs = { new_benefits: true, redemptions: true, disputes: true, biz_summary: false };

/** The switches shown to each audience, with their labels. */
export const PREF_LABELS: { type: NotificationType; label: string; hint: string; audience: "resident" | "business" }[] = [
  { type: "new_benefits", label: "הטבות חדשות ליד הבית", hint: "כשעסק בשכונה מצטרף או מוסיף הטבה", audience: "resident" },
  { type: "redemptions", label: "מימוש הושלם", hint: "אישור מהקופה, עם כמה חסכתם", audience: "resident" },
  { type: "disputes", label: "עדכון על דיווח", hint: "כשדיווח על סכום תוקן או נדחה", audience: "resident" },
  { type: "biz_summary", label: "סיכום מימושים יומי", hint: "פעם ביום, אם היו מימושים", audience: "business" },
];

/** Whether an account with these saved switches (or none) wants this type. */
export const wants = (saved: Partial<NotificationPrefs> | null, type: NotificationType) => saved?.[type] ?? DEFAULT_PREFS[type];

/** Clean switches from a request body (unknown keys and non-booleans ignored). */
export function parsePrefs(raw: unknown): Partial<NotificationPrefs> {
  const out: Partial<NotificationPrefs> = {};
  if (typeof raw !== "object" || raw === null) return out;
  for (const key of Object.keys(DEFAULT_PREFS) as NotificationType[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "boolean") out[key] = v;
  }
  return out;
}
