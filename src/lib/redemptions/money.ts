// Shekel formatting for the screens that show totals from the database (statements, reports, the wallet).
// Redemption math lives in src/lib/qr/money.ts (integer agorot, the rates from each business's benefit).

const shekels = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });

/** Formats a number as shekels, e.g. "‏90.00 ₪". */
export const formatShekels = (value: number) => shekels.format(value);
