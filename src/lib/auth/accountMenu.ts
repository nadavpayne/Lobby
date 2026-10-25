import type { Role } from "./homeFor.ts";

export interface MenuLink {
  href: string;
  label: string;
}

/** The business area's shortcuts: the owner gets the whole CRM, a cashier only the register. */
export function businessLinks(roles: Role[]): MenuLink[] {
  if (roles.includes("business_owner")) {
    return [
      { href: "/biz", label: "לוח בקרה" },
      { href: "/biz/scan", label: "סריקת קוד של דייר" },
      { href: "/biz/offers", label: "ההטבות שלי" },
      { href: "/biz/redemptions", label: "מימושים" },
      { href: "/biz/profile", label: "פרופיל העסק" },
    ];
  }
  if (roles.includes("cashier")) return [{ href: "/cashier", label: "קופה" }];
  return [];
}

/** The account's other apps (resident app, admin), shown under "עוד". */
export function otherApps(roles: Role[]): MenuLink[] {
  const links: MenuLink[] = [];
  if (roles.includes("resident") || roles.includes("committee")) links.push({ href: "/app", label: "ההטבות שלי בבניין" });
  if (roles.includes("admin")) links.push({ href: "/admin", label: "ניהול לובי" });
  return links;
}
