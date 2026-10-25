// A business's monthly charge with dispute corrections, counted exactly once. Pure.

/** A month's redeemed totals as the database has them now (corrections already applied to the redemptions). */
export interface MonthTotals {
  period: string;
  redemptions: number;
  gmv: number;
  /** Shekels, from commissions_monthly. */
  commission: number;
}

/** A correction to a month that was already charged. */
export interface Adjustment {
  period: string;
  applyPeriod: string;
  commissionDiffAgorot: number;
}

export interface StatementMonth extends MonthTotals {
  /** Corrections carried into this month's charge from earlier months (agorot, can be negative). */
  adjustmentsAgorot: number;
  /** What this month is charged: its own redemptions as charged, plus the carried corrections. */
  charged: number;
}

const toAgorot = (shekels: number) => Math.round(shekels * 100);

/**
 * Each month's charge. A late correction already changed its own month's redemptions, so it is taken back out of
 * that month (which was charged before the correction) and added to the month it was made in: once, never twice.
 */
export function buildStatement(months: MonthTotals[], adjustments: Adjustment[]): StatementMonth[] {
  const byPeriod = new Map(months.map((m) => [m.period, { ...m }]));
  for (const a of adjustments) {
    if (!byPeriod.has(a.applyPeriod)) byPeriod.set(a.applyPeriod, { period: a.applyPeriod, redemptions: 0, gmv: 0, commission: 0 });
  }
  return [...byPeriod.values()]
    .map((m) => {
      const carriedIn = adjustments.filter((a) => a.applyPeriod === m.period).reduce((s, a) => s + a.commissionDiffAgorot, 0);
      const lateOut = adjustments.filter((a) => a.period === m.period).reduce((s, a) => s + a.commissionDiffAgorot, 0);
      return { ...m, adjustmentsAgorot: carriedIn, charged: (toAgorot(m.commission) - lateOut + carriedIn) / 100 };
    })
    .sort((a, b) => b.period.localeCompare(a.period));
}
