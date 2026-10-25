// Details shown on the legal pages. Fill OPERATOR before public launch.
export const LEGAL = {
  /** Legal name of whoever operates Lobby (person or company, with ID/company number). */
  operator: "[שם המפעיל ומספר עוסק/ח.פ.]",
  contactEmail: "npayne191@gmail.com",
  accessibilityLead: "נדב פיין",
  updated: "25.10.2026",
} as const;

/** All legal documents, in footer order. */
export const LEGAL_PAGES = [
  ["/terms", "תקנון ותנאי שימוש"],
  ["/business-terms", "תנאים לעסקים"],
  ["/privacy", "מדיניות פרטיות"],
  ["/cookies", "מדיניות עוגיות"],
  ["/accessibility", "הצהרת נגישות"],
] as const;
