export type MemberRole = "resident" | "committee";
export type MemberStatus = "active" | "pending";

/** The signed-in user's building as the app shows it. inviteUrl is only given to the committee. */
export interface MyBuilding {
  role: MemberRole;
  status: MemberStatus;
  apartmentNumber: string;
  address: string;
  city: string;
  apartmentCount: number | null;
  inviteUrl?: string;
}
