import { Coffee, Croissant, Dumbbell, PawPrint, Pill, Scissors, ShoppingBasket, Utensils, WashingMachine, type LucideIcon } from "lucide-react";

// The "במרחק הליכה" illustration's content. Swap a category here (an id from data/business-categories.json and its
// icon); the layout reads positions from RINGS and BADGES only.

/** Rings by walking time, radius in % of the illustration's width. Everyday shops sit closest. */
export const RINGS = [
  { minutes: 2, radius: 19 },
  { minutes: 5, radius: 32 },
  { minutes: 10, radius: 44 },
] as const;

export interface WalkingBadge {
  /** Subcategory id in data/business-categories.json. */
  id: string;
  icon: LucideIcon;
  /** Index into RINGS. */
  ring: 0 | 1 | 2;
  /** Position on the ring, degrees clockwise from the right (90 = straight down, where the time labels sit). */
  angle: number;
  /** Still shown when the illustration is narrow (6 of the 9). */
  compact: boolean;
}

export const BADGES: WalkingBadge[] = [
  { id: "cafe", icon: Coffee, ring: 0, angle: 200, compact: true },
  { id: "bakery", icon: Croissant, ring: 0, angle: 340, compact: true },
  { id: "grocery_supermarket", icon: ShoppingBasket, ring: 0, angle: 270, compact: false },
  { id: "hair_salon", icon: Scissors, ring: 1, angle: 160, compact: true },
  { id: "pharmacy", icon: Pill, ring: 1, angle: 20, compact: true },
  { id: "laundry_dry_cleaning", icon: WashingMachine, ring: 1, angle: 235, compact: false },
  { id: "gym", icon: Dumbbell, ring: 2, angle: 300, compact: true },
  { id: "restaurant", icon: Utensils, ring: 2, angle: 125, compact: true },
  { id: "pet_store", icon: PawPrint, ring: 2, angle: 55, compact: false },
];

/** Where a point on a ring sits, as left/top percentages of the square (2 decimals: server and browser print the same style). */
export function onRing(radius: number, angle: number): { left: number; top: number } {
  const rad = (angle * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { left: round(50 + radius * Math.cos(rad)), top: round(50 + radius * Math.sin(rad)) };
}
