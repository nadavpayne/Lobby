import {
  Baby, Croissant, Dumbbell, HeartPulse, PawPrint, ShoppingBasket, Sofa, Sparkles, Store, Utensils, Wrench,
  type LucideIcon,
} from "lucide-react";

// Keyed by categories.icon in the database. A static map keeps the bundle to the icons we use.
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  croissant: Croissant,
  "shopping-basket": ShoppingBasket,
  sofa: Sofa,
  sparkles: Sparkles,
  baby: Baby,
  dumbbell: Dumbbell,
  "heart-pulse": HeartPulse,
  "paw-print": PawPrint,
  wrench: Wrench,
  store: Store,
};

/** Icon for a category's icon name; falls back to a shop icon. */
export function CategoryIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Store;
  return <Icon aria-hidden className={className} />;
}
