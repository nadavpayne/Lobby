import taxonomy from "../../../data/business-categories.json" with { type: "json" };

/**
 * Business taxonomy from data/business-categories.json: exactly one primary category, 1–2 of its subcategories,
 * and any number of tags. IDs are stored; labels can change freely. Primary IDs must also exist in the
 * categories table (businesses.category has a foreign key to it; migration 20261026010000 keeps them in sync).
 */
export type Category = string;

export interface TaxonomyItem {
  id: string;
  label: string;
}

/** Primary category ID → Hebrew label, in display order. */
export const CATEGORIES: Record<Category, string> = Object.fromEntries(taxonomy.categories.map((c) => [c.id, c.label]));

/** Primary category ID → its subcategories (empty for "other"). */
export const SUBCATEGORIES: Record<Category, TaxonomyItem[]> = Object.fromEntries(taxonomy.categories.map((c) => [c.id, c.subcategories]));

/** Tags any business may have (kosher, delivery, …). */
export const TAGS: TaxonomyItem[] = taxonomy.tags;

/** Icon per primary category (lucide names, same as the categories table's icon column). */
export const CATEGORY_ICONS: Record<Category, string> = {
  restaurants: "utensils",
  food_grocery: "shopping-basket",
  beauty: "sparkles",
  health: "heart-pulse",
  fitness: "dumbbell",
  home: "sofa",
  local_services: "wrench",
  car: "car",
  shopping: "shopping-bag",
  kids_family: "baby",
  pets: "paw-print",
  leisure: "ticket",
  other: "store",
};

/** Label of a subcategory or tag ID (falls back to the ID). */
export function taxonomyLabel(id: string): string {
  for (const c of taxonomy.categories) for (const s of c.subcategories) if (s.id === id) return s.label;
  return TAGS.find((t) => t.id === id)?.label ?? id;
}
