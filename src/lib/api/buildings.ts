import type { BuildingErrors } from "@/lib/buildings/validateBuilding";
import type { MyBuilding } from "@/lib/buildings/types";
import { apiFetch, type ApiError } from "./http";

/** The signed-in user's building (null if they haven't joined one). */
export const fetchMyBuilding = (token: string) => apiFetch<{ building: MyBuilding | null }>("/api/me/building", { token });

/** Registers a building; the signed-in user becomes its committee member. */
export const registerBuilding = (token: string, input: Record<string, unknown>) =>
  apiFetch<{ inviteUrl: string }>("/api/buildings", { token, body: input }) as Promise<
    { inviteUrl: string } | ({ errors: BuildingErrors } & ApiError) | ApiError
  >;
