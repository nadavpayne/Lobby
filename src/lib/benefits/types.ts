// A business's benefit: monthly (once per apartment per calendar month) or one-time (once ever at this business).

export type BenefitType = "monthly" | "one_time";
/** Who the one-time benefit is counted for. */
export type OneTimeScope = "apartment" | "resident";

export const BENEFIT_TYPE_LABEL: Record<BenefitType, string> = { monthly: "הטבה חודשית", one_time: "הטבה חד־פעמית" };
export const ONE_TIME_SCOPE_LABEL: Record<OneTimeScope, string> = { apartment: "פעם אחת לכל דירה", resident: "פעם אחת לכל דייר" };

/** The rule line shown on the QR screen. */
export function benefitRule(type: BenefitType, scope: OneTimeScope): string {
  if (type === "monthly") return "הטבה אחת בחודש לדירה בכל עסק.";
  return scope === "resident" ? "ההטבה ניתנת פעם אחת בלבד לכל דייר." : "ההטבה ניתנת פעם אחת בלבד לכל דירה.";
}
