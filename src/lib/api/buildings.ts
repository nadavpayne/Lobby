import type { BuildingErrors } from "@/lib/buildings/validateBuilding";
import type { MemberStatus, MyBuilding } from "@/lib/buildings/types";
import type { ResidentJoinErrors } from "@/lib/buildings/validateResidentJoin";
import { apiFetch, type ApiError } from "./http";

/** The signed-in user's building (null if they haven't joined one). */
export const fetchMyBuilding = (token: string) => apiFetch<{ building: MyBuilding | null }>("/api/me/building", { token });

/** Registers a building; the signed-in user becomes its committee member. */
export const registerBuilding = (token: string, input: Record<string, unknown>) =>
  apiFetch<{ inviteUrl: string }>("/api/buildings", { token, body: input }) as Promise<
    { inviteUrl: string } | ({ errors: BuildingErrors } & ApiError) | ApiError
  >;

/** Joins the invited building in the given apartment; the server decides active or pending approval. */
export const joinBuildingRequest = (token: string, input: Record<string, unknown>) =>
  apiFetch<{ status: MemberStatus }>("/api/buildings/join", { token, body: input }) as Promise<
    { status: MemberStatus } | ({ errors: ResidentJoinErrors } & ApiError) | ApiError
  >;
