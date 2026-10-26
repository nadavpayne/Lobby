import "server-only";
import { SUPPORT_ROLES, SUPPORT_TOPICS, SUPPORT_EMAIL } from "./config";
import type { SupportInput } from "./validate";

const label = (list: readonly (readonly [string, string])[], v: string) => list.find(([k]) => k === v)?.[1] ?? v;

/**
 * Emails a support request to the support address through Resend (RESEND_API_KEY; sender RESEND_FROM).
 * Returns false when email isn't set up yet or sending failed: the request is still saved and listed in the admin area.
 */
export async function emailSupportRequest(r: SupportInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !SUPPORT_EMAIL) return false;
  const body = [
    `שם: ${r.name}`, `אימייל: ${r.email}`, `תפקיד: ${label(SUPPORT_ROLES, r.role)}`, `נושא: ${label(SUPPORT_TOPICS, r.topic)}`, "", r.message,
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? `Lobby <${SUPPORT_EMAIL}>`,
        to: [SUPPORT_EMAIL],
        reply_to: r.email,
        subject: `פנייה חדשה: ${label(SUPPORT_TOPICS, r.topic)}`,
        text: body,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
