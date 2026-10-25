import type { LucideIcon } from "lucide-react";

/** One destination in a bottom nav or side nav. */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** True when the nav item is the current page (or a page under it, except for the app's root item). */
export function isCurrent(path: string, href: string, rootHref: string): boolean {
  return href === rootHref ? path === href : path === href || path.startsWith(`${href}/`);
}
