// Who can report a redemption, and what a valid report looks like. Pure: no database, no UI.
import { parseBillAgorot } from "../qr/money.ts";
import { NOTE_MAX, REPORT_WINDOW_DAYS, REPORTS_PER_MONTH } from "./config.ts";
import { DISPUTE_REASONS, type DisputeReason } from "./types.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The facts a report decision needs. */
export interface ReportContext {
  redemption: { apartmentId: string; status: "redeemed" | "voided"; redeemedAt: string; billAgorot: number };
  reporterApartmentId: string;
  hasDispute: boolean;
  reportsThisMonth: number;
  now: Date;
}

export type ReportBlock = "NOT_YOURS" | "VOIDED" | "WINDOW_CLOSED" | "ALREADY_REPORTED" | "RATE_LIMITED";

/** Last moment a redemption can still be reported. */
export const reportDeadline = (redeemedAt: string) => new Date(new Date(redeemedAt).getTime() + REPORT_WINDOW_DAYS * DAY_MS);

/** Whether the "amount not right?" action shows for a redemption (the history list uses this without the rate limit). */
export const withinWindow = (redeemedAt: string, now: Date) => now < reportDeadline(redeemedAt);

/** Why this resident can't report this redemption now, or null if they can. */
export function reportBlock(c: ReportContext): ReportBlock | null {
  if (c.redemption.apartmentId !== c.reporterApartmentId) return "NOT_YOURS";
  if (c.redemption.status !== "redeemed") return "VOIDED";
  if (c.hasDispute) return "ALREADY_REPORTED";
  if (!withinWindow(c.redemption.redeemedAt, c.now)) return "WINDOW_CLOSED";
  if (c.reportsThisMonth >= REPORTS_PER_MONTH) return "RATE_LIMITED";
  return null;
}

export const BLOCK_MESSAGE: Record<ReportBlock, string> = {
  NOT_YOURS: "המימוש הזה לא שייך לדירה שלכם",
  VOIDED: "המימוש בוטל, אין מה לדווח עליו",
  WINDOW_CLOSED: `אפשר לדווח עד ${REPORT_WINDOW_DAYS} ימים אחרי המימוש`,
  ALREADY_REPORTED: "כבר נשלח דיווח על המימוש הזה",
  RATE_LIMITED: `אפשר לשלוח עד ${REPORTS_PER_MONTH} דיווחים בחודש`,
};

export interface DisputeInput {
  reason: DisputeReason;
  claimedBillAgorot: number | null;
  note: string | null;
}

/** Checks the form fields against the recorded bill: field errors, or the clean input. */
export function validateDispute(
  raw: { reason?: unknown; claimedBill?: unknown; note?: unknown },
  recordedBillAgorot: number,
): { ok: true; data: DisputeInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const reason = DISPUTE_REASONS.find((r) => r === raw.reason);
  if (!reason) errors.reason = "צריך לבחור מה לא היה נכון";

  const typed = typeof raw.claimedBill === "string" ? raw.claimedBill.trim() : raw.claimedBill;
  const empty = typed === undefined || typed === null || typed === "";
  const claimed = empty ? null : parseBillAgorot(typed);
  if (!empty && claimed === null) errors.claimedBill = "סכום לא תקין";
  else if (reason === "BILL_HIGHER" && claimed === null) errors.claimedBill = "כמה היה החשבון בפועל?";
  else if (reason === "BILL_HIGHER" && claimed !== null && claimed <= recordedBillAgorot) errors.claimedBill = "הסכום צריך להיות גבוה מהסכום שנרשם";

  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  if (note.length > NOTE_MAX) errors.note = `עד ${NOTE_MAX} תווים`;

  if (Object.keys(errors).length > 0 || !reason) return { ok: false, errors };
  return { ok: true, data: { reason, claimedBillAgorot: claimed, note: note || null } };
}
