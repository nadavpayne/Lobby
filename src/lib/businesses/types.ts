/** lead = added by Lobby sales, not signed up yet; pending = signed up / negotiating; active = live; paused. */
export type BusinessStatus = "lead" | "pending" | "active" | "paused";

/** What the terminal shows about the signed-in business. */
export interface BusinessInfo {
  name: string;
  status: BusinessStatus;
  isDemo: boolean;
}
