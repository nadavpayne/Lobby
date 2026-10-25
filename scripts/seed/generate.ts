// Pure generator for seeded redemption history (no database). Deterministic for a given seed.
import { currentPeriod } from "../../src/lib/period.ts";
import { calcRedemption } from "../../src/lib/redemptions/money.ts";

/** Small seeded PRNG (mulberry32): same seed, same demo data. Returns floats in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlanBusiness {
  discount: number;
  commission: number;
  bill: [number, number];
  weight: number;
  /** First moment its offer can be redeemed. */
  liveFrom: Date;
}

export interface PlanApartment {
  key: string;
  residentIdx: number;
  /** 0..1: how much this household uses Lobby. */
  activity: number;
}

export interface PlannedRedemption {
  apartmentKey: string;
  businessIdx: number;
  residentIdx: number;
  status: "redeemed" | "expired";
  issuedAt: Date;
  expiresAt: Date;
  redeemedAt: Date | null;
  amount: number | null;
  discountAmount: number | null;
  commissionAmount: number | null;
  period: string;
}

const israelDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", day: "numeric" });
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_PER_MONTH = 9;

/** The last `count` calendar months up to and including now's, oldest first, e.g. ["2026-08", "2026-09", "2026-10"]. */
export function lastMonths(now: Date, count: number): string[] {
  const [y, m] = currentPeriod(now).split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Picks up to n distinct indexes, each chance proportional to its weight. */
function pickWeighted(weights: number[], n: number, random: () => number): number[] {
  const left = weights.map((w, i) => ({ w, i }));
  const picked: number[] = [];
  while (picked.length < n && left.length > 0) {
    let r = random() * left.reduce((s, x) => s + x.w, 0);
    const at = left.findIndex((x) => (r -= x.w) < 0);
    picked.push(left.splice(at === -1 ? left.length - 1 : at, 1)[0].i);
  }
  return picked;
}

/** A random daytime moment (09:00–21:59 Israel time) in the month, never after `now`. */
function randomMoment(period: string, now: Date, random: () => number): Date | null {
  const [y, m] = period.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // This month: only days before today, so nothing lands in the future.
  const lastDay = period === currentPeriod(now) ? Number(israelDay.format(now)) - 1 : daysInMonth;
  if (lastDay < 1) return null;
  const day = 1 + Math.floor(random() * lastDay);
  const hour = 9 + Math.floor(random() * 13);
  // shortcut: fixed UTC+3 (summer time); a winter date lands an hour later, still inside the same day.
  return new Date(Date.UTC(y, m - 1, day, hour - 3, Math.floor(random() * 60)));
}

/** Three months of history: each apartment uses a few businesses per month, at most once each (the core rule). */
export function planRedemptions(
  apartments: PlanApartment[],
  businesses: PlanBusiness[],
  months: string[],
  now: Date,
  random: () => number,
): PlannedRedemption[] {
  const out: PlannedRedemption[] = [];
  for (const period of months) {
    for (const apt of apartments) {
      const count = Math.round(apt.activity * MAX_PER_MONTH * random());
      for (const businessIdx of pickWeighted(businesses.map((b) => b.weight), count, random)) {
        const b = businesses[businessIdx];
        const issuedAt = randomMoment(period, now, random);
        if (!issuedAt || issuedAt < b.liveFrom) continue;
        const base = { apartmentKey: apt.key, businessIdx, residentIdx: apt.residentIdx, issuedAt, expiresAt: new Date(issuedAt.getTime() + CODE_TTL_MS), period: currentPeriod(issuedAt) };
        if (random() < 0.06) {
          out.push({ ...base, status: "expired", redeemedAt: null, amount: null, discountAmount: null, commissionAmount: null });
          continue;
        }
        const bill = Math.round(b.bill[0] + random() * (b.bill[1] - b.bill[0]));
        const money = calcRedemption(bill, b.discount, b.commission);
        out.push({
          ...base,
          status: "redeemed",
          redeemedAt: new Date(issuedAt.getTime() + (1 + Math.floor(random() * 8)) * 60 * 1000),
          amount: money.amount,
          discountAmount: money.discountAmount,
          commissionAmount: money.commissionAmount,
        });
      }
    }
  }
  return out;
}
