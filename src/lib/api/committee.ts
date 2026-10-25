import type { BuildingStats, PendingMember } from "@/lib/buildings/types";
import { apiFetch } from "./http";

/** Phones waiting for my approval. */
export const fetchApprovals = (token: string) => apiFetch<PendingMember[]>("/api/me/approvals", { token });

/** Approves or rejects a waiting phone. */
export const decideApproval = (token: string, residentId: string, decision: "approve" | "reject") =>
  apiFetch<{ ok: true }>("/api/me/approvals", { token, body: { residentId, decision } });

/** Committee: the building's members and savings this month. */
export const fetchBuildingStats = (token: string) => apiFetch<BuildingStats>("/api/me/building/stats", { token });
