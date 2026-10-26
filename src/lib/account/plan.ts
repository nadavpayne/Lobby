// What deleting an account means for each role: shown on the explanation screen. Pure.

export type AccountRole = "resident" | "committee" | "business_owner" | "cashier" | "admin";

export interface DeletionNotice {
  /** Admin accounts are removed by hand, never from the app. */
  allowed: boolean;
  deleted: string[];
  kept: string[];
  /** Extra consequences for a business owner. */
  business: string[];
  /** The only committee member of the building: offer to hand the role over first. */
  committeeHandover: boolean;
}

/** The explanation for an account with these roles. */
export function deletionNotice(roles: AccountRole[], soleCommittee: boolean): DeletionNotice {
  const isResident = roles.includes("resident") || roles.includes("committee");
  const isOwner = roles.includes("business_owner");
  return {
    allowed: !roles.includes("admin"),
    deleted: [
      "השם, כתובת האימייל וההתחברות לחשבון",
      ...(isResident ? ["השיוך לדירה ולבניין", "היסטוריית המימושים שמוצגת לכם, וקודים שעוד לא מומשו"] : []),
      "התראות והעדפות התראות",
      "צילומי קבלות והערות שצירפתם לדיווחים",
    ],
    kept: [
      "רשומות המימוש והחיוב נשמרות לצורכי הנהלת חשבונות ודרישות החוק, בלי שום קישור אליכם: רק הדירה, הבניין, העסק והסכומים.",
    ],
    business: isOwner
      ? [
          "העסק יוצא מהמועדון: ההטבה שלו מפסיקה להופיע לדיירים, והסריקה בקופה מושבתת.",
          "כל הגישות של הקופאים מבוטלות.",
          "עמלה שכבר נצברה ועוד לא שולמה נשארת לתשלום.",
        ]
      : [],
    committeeHandover: roles.includes("committee") && soleCommittee,
  };
}
