export type BusinessStatus = "pending" | "active" | "paused";

/** What the terminal shows about the signed-in business. */
export interface BusinessInfo {
  name: string;
  status: BusinessStatus;
  isDemo: boolean;
}
