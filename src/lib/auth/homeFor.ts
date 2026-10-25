/** Every role an account can hold. resident / committee come from residents; the rest from user_roles. */
export type Role = "resident" | "committee" | "business_owner" | "admin";

/** Which app each role opens. */
export type AppHome = "/app" | "/biz" | "/admin";

/** The roles each app accepts. */
export const APP_ROLES: Record<AppHome, Role[]> = {
  "/app": ["resident", "committee"],
  "/biz": ["business_owner"],
  "/admin": ["admin"],
};

/** Where an account lands after login: admin first, then business owner, then resident; null = no role. */
export function homeFor(roles: Role[]): AppHome | null {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("business_owner")) return "/biz";
  if (roles.includes("resident") || roles.includes("committee")) return "/app";
  return null;
}

/** True if the account may open the given app. */
export function canOpen(roles: Role[], app: AppHome): boolean {
  return APP_ROLES[app].some((r) => roles.includes(r));
}
