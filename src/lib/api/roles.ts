import type { AppHome, Role } from "@/lib/auth/homeFor";
import { apiFetch } from "./http";

export interface MyRoles {
  roles: Role[];
  home: AppHome | null;
}

/** My account's roles and the app it opens. */
export const fetchRoles = (token: string) => apiFetch<MyRoles>("/api/me/roles", { token });
