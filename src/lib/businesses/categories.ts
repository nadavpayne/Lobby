/**
 * Business categories: stored key -> Hebrew label. Keys are stable; labels can change freely.
 * Keys must exist in the categories table (businesses.category has a foreign key to it).
 */
export const CATEGORIES = {
  food: "מסעדה / בית קפה",
  grocery: "מכולת / סופרמרקט",
  bakery: "מאפייה / קונדיטוריה",
  beauty: "יופי וטיפוח",
  fitness: "כושר וספורט",
  health: "בריאות / פארם",
  pets: "חיות מחמד",
  services: "שירותים לבית",
  home: "לבית ועיצוב",
  kids: "ילדים",
  other: "אחר",
} as const;

export type Category = keyof typeof CATEGORIES;

/** Icon per category (same names as the categories table's icon column), for previews outside the resident feed. */
export const CATEGORY_ICONS: Record<Category, string> = {
  food: "utensils", grocery: "shopping-basket", bakery: "croissant", beauty: "sparkles", fitness: "dumbbell",
  health: "heart-pulse", pets: "paw-print", services: "wrench", home: "sofa", kids: "baby", other: "store",
};
