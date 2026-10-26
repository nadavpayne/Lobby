// The support form's rules. Pure: shared by the form (instant feedback) and the API (the real check).
import { MESSAGE_MAX, PER_EMAIL_PER_HOUR, PER_IP_PER_HOUR, SUPPORT_ROLES, SUPPORT_TOPICS, type SupportRole, type SupportTopic } from "./config.ts";

export interface SupportInput {
  name: string;
  email: string;
  role: SupportRole;
  topic: SupportTopic;
  message: string;
}

export type SupportErrors = Partial<Record<keyof SupportInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Checks the fields: errors per field, or the clean input. */
export function validateSupport(raw: Record<string, unknown> | null): { ok: true; data: SupportInput } | { ok: false; errors: SupportErrors } {
  const errors: SupportErrors = {};
  const name = text(raw?.name);
  const email = text(raw?.email).toLowerCase();
  const message = text(raw?.message);
  const role = SUPPORT_ROLES.find(([v]) => v === raw?.role)?.[0];
  const topic = SUPPORT_TOPICS.find(([v]) => v === raw?.topic)?.[0];

  if (name.length < 2 || name.length > 80) errors.name = "צריך לכתוב שם";
  if (!EMAIL.test(email) || email.length > 254) errors.email = "כתובת אימייל לא תקינה";
  if (!role) errors.role = "צריך לבחור";
  if (!topic) errors.topic = "צריך לבחור נושא";
  if (message.length < 5) errors.message = "ספרו לנו במה אפשר לעזור";
  else if (message.length > MESSAGE_MAX) errors.message = `עד ${MESSAGE_MAX} תווים`;

  if (Object.keys(errors).length > 0 || !role || !topic) return { ok: false, errors };
  return { ok: true, data: { name, email, role, topic, message } };
}

/** A filled honeypot field means a bot: accept silently, store nothing. */
export const isBot = (raw: Record<string, unknown> | null) => text(raw?.website) !== "";

/** Whether this sender already sent too many requests in the last hour. */
export const rateLimited = (lastHour: { byIp: number; byEmail: number }) => lastHour.byIp >= PER_IP_PER_HOUR || lastHour.byEmail >= PER_EMAIL_PER_HOUR;
