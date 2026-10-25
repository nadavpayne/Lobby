import { TINT_CYCLE, type Tint } from "@/components/ui";
import type { FeedCategory } from "@/lib/offers/types";

/** A category's chip name, icon and card tint (tints cycle in category order, so each category keeps its color). */
export function categoryStyle(categories: FeedCategory[], slug: string): { name: string; icon: string; tint: Tint } {
  const i = categories.findIndex((c) => c.slug === slug);
  const c = categories[i];
  return { name: c?.name ?? "", icon: c?.icon ?? "store", tint: TINT_CYCLE[Math.max(0, i) % TINT_CYCLE.length] };
}
