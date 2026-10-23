/** Business categories: stored key -> Hebrew label. Keys are stable; labels can change freely. */
export const CATEGORIES = {
  food: "מסעדה / בית קפה",
  grocery: "מכולת / סופרמרקט",
  bakery: "מאפייה / קונדיטוריה",
  beauty: "יופי וטיפוח",
  fitness: "כושר וספורט",
  health: "בריאות / פארם",
  pets: "חיות מחמד",
  services: "שירותים לבית",
  other: "אחר",
} as const;

export type Category = keyof typeof CATEGORIES;
