// Tunable dispute rules in one place.

/** Days after a redemption during which a resident can report its amount. */
export const REPORT_WINDOW_DAYS = 7;

/** Reports one resident can send per calendar month (anti-spam). */
export const REPORTS_PER_MONTH = 5;

/** A business is flagged when its month has at least this many disputes... */
export const FLAG_MIN_DISPUTES = 3;
/** ...and disputes are at least this share of its redemptions. */
export const FLAG_DISPUTE_RATE = 0.05;

/** Longest note a resident can add. */
export const NOTE_MAX = 500;

/** How long an admin's receipt-photo link works. */
export const RECEIPT_URL_SECONDS = 600;
