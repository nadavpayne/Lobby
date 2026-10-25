import type { ResidentOffer } from "./types";

export interface FeedSection {
  key: "hot" | "new" | "near" | "upcoming" | "permanent";
  title: string;
  offers: ResidentOffer[];
}

const NEW_DAYS = 30;
const PER_SECTION = 8;

/** The home feed's carousels, in order; empty ones are left out. A business may appear in several. */
export function feedSections(offers: ResidentOffer[], now = new Date()): FeedSection[] {
  const live = offers.filter((o) => o.state !== "upcoming");
  const newSince = now.getTime() - NEW_DAYS * 24 * 60 * 60 * 1000;

  const sections: FeedSection[] = [
    { key: "hot", title: "החמות ביותר", offers: live.filter((o) => o.recentRedemptions > 0).sort((a, b) => b.recentRedemptions - a.recentRedemptions) },
    { key: "new", title: "חדש בלובי", offers: live.filter((o) => Date.parse(o.joinedAt) >= newSince).sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt)) },
    { key: "near", title: "ליד הבניין", offers: live.filter((o) => o.distanceMeters !== null).sort((a, b) => a.distanceMeters! - b.distanceMeters!) },
    { key: "upcoming", title: "נפתחות בקרוב", offers: offers.filter((o) => o.state === "upcoming").sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!)) },
    { key: "permanent", title: "הנחות קבועות", offers: live.filter((o) => !o.endsAt) },
  ];
  return sections.map((s) => ({ ...s, offers: s.offers.slice(0, PER_SECTION) })).filter((s) => s.offers.length > 0);
}

/** Up to 3 offers for the rotating hero banner: the hottest, else the first live ones. */
export function heroOffers(offers: ResidentOffer[]): ResidentOffer[] {
  const live = offers.filter((o) => o.state !== "upcoming");
  return [...live].sort((a, b) => b.recentRedemptions - a.recentRedemptions).slice(0, 3);
}
