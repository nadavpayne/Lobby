export const COMMISSION_PERCENT = 5;
const MAX_AMOUNT = 100_000;

export interface RedemptionAmounts {
  amount: number;
  discountAmount: number;
  commissionAmount: number;
  payAmount: number;
}

/** Parses a bill amount typed by the business ("120", "120.5", "1,200"); null if invalid or out of range. */
export function parseAmount(input: unknown): number | null {
  const text = typeof input === "number" ? String(input) : typeof input === "string" ? input.replace(/[,\s₪]/g, "") : "";
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return amount > 0 && amount <= MAX_AMOUNT ? amount : null;
}

/** Splits the full pre-discount bill into discount, Lobby commission and what the resident pays. Rounds to the agora. */
export function calcRedemption(amount: number, discountPercent: number): RedemptionAmounts {
  const agorot = Math.round(amount * 100);
  const discount = Math.round((agorot * discountPercent) / 100);
  const commission = Math.round((agorot * COMMISSION_PERCENT) / 100);
  return {
    amount: agorot / 100,
    discountAmount: discount / 100,
    commissionAmount: commission / 100,
    payAmount: (agorot - discount) / 100,
  };
}

const shekels = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });

/** Formats a number as shekels, e.g. "‏90.00 ₪". */
export const formatShekels = (value: number) => shekels.format(value);
