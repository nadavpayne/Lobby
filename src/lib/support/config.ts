// Support settings and the form's choices. Safe on both server and client.

/** The public support address (set NEXT_PUBLIC_SUPPORT_EMAIL once the Lobby domain is ready); null until then. */
export const SUPPORT_EMAIL: string | null = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null;

/** What we promise on the confirmation screen. */
export const RESPONSE_TIME = "נחזור אליכם תוך 2 ימי עסקים";

export const MESSAGE_MAX = 2000;

/** Requests one IP / one email may send per hour. */
export const PER_IP_PER_HOUR = 5;
export const PER_EMAIL_PER_HOUR = 3;

export const SUPPORT_ROLES = [
  ["resident", "דייר/ת"],
  ["committee", "ועד בית"],
  ["business", "בעל/ת עסק"],
  ["other", "אחר"],
] as const;

export const SUPPORT_TOPICS = [
  ["account", "חשבון וכניסה"],
  ["redemption", "הטבה או מימוש"],
  ["dispute", "סכום שנרשם לא נכון"],
  ["join_business", "הצטרפות כעסק"],
  ["join_building", "הצטרפות כבניין"],
  ["deletion", "מחיקת חשבון"],
  ["other", "אחר"],
] as const;

export type SupportRole = (typeof SUPPORT_ROLES)[number][0];
export type SupportTopic = (typeof SUPPORT_TOPICS)[number][0];
