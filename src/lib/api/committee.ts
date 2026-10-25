import type { BuildingStats } from "@/lib/buildings/types";
import { apiFetch } from "./http";

/** Committee: the building's members and savings this month. */
export const fetchBuildingStats = (token: string) => apiFetch<BuildingStats>("/api/me/building/stats", { token });
