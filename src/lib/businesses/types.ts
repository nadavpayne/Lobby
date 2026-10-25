/** lead = added by Lobby sales, not signed up yet; pending = signed up / negotiating; active = live; paused; declined = turned down by Lobby. */
export type BusinessStatus = "lead" | "pending" | "active" | "paused" | "declined";

/** What the terminal shows about the signed-in business. */
export interface BusinessInfo {
  name: string;
  status: BusinessStatus;
  isDemo: boolean;
}
