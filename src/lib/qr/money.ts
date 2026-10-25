// Redemption money in integer agorot (1 ₪ = 100 agorot), matching approve_redemption() in the database exactly.

export interface Split {
  billAgorot: number;
  discountAgorot: number;
  paidAgorot: number;
  commissionAgorot: number;
}

const MAX_BILL_AGOROT = 10_000_000; // ₪100,000

/** A typed bill ("120", "120.5", "1,200", "₪ 80") → agorot; null if not a positive amount up to ₪100,000. */
export function parseBillAgorot(input: unknown): number | null {
  const text = typeof input === "number" ? String(input) : typeof input === "string" ? input.replace(/[,\s₪]/g, "") : "";
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, frac = ""] = text.split(".");
  const agorot = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return agorot > 0 && agorot <= MAX_BILL_AGOROT ? agorot : null;
}

/** rate% of an agorot amount, rounded half up (rates have up to 2 decimals: integer math, no float drift). */
const percentOf = (agorot: number, rate: number) => Math.round((agorot * Math.round(rate * 100)) / 10_000);

/** Discount, amount paid and Lobby's commission for a bill. Commission on the pre-discount bill ("gross") or after it ("net"). */
export function splitBill(billAgorot: number, discountRate: number, commissionRate: number, base: "gross" | "net" = "gross"): Split {
  const discountAgorot = percentOf(billAgorot, discountRate);
  const paidAgorot = billAgorot - discountAgorot;
  return { billAgorot, discountAgorot, paidAgorot, commissionAgorot: percentOf(base === "net" ? paidAgorot : billAgorot, commissionRate) };
}

const shekels = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });

/** Agorot as shekels, e.g. 8400 → "‏84.00 ₪". */
export const formatAgorot = (agorot: number) => shekels.format(agorot / 100);
