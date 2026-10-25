export type MemberRole = "resident" | "committee";
export type MemberStatus = "active" | "pending" | "blocked";

/** The signed-in user's building as the app shows it. inviteUrl is only given to the committee; the optional fields come from GET /api/me/building. */
export interface MyBuilding {
  role: MemberRole;
  status: MemberStatus;
  apartmentNumber: string;
  address: string;
  city: string;
  apartmentCount: number | null;
  /** Friendly name ("בית רוטשילד"); show the address when unset. */
  name?: string | null;
  /** Active accounts in the building, me included. */
  neighbors?: number;
  committeeName?: string | null;
  committeePhone?: string | null;
  inviteUrl?: string;
}

/** A second phone waiting to be let into an apartment. */
export interface PendingMember {
  residentId: string;
  name: string | null;
  apartmentNumber: string;
  requestedAt: string;
}

/** The committee's view of the building this month. */
export interface BuildingStats {
  apartmentsTotal: number;
  apartmentsJoined: number;
  members: number;
  pending: number;
  redemptionsThisMonth: number;
  savedThisMonth: number;
}
