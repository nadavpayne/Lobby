"use client";

import { BenefitCard } from "@/components/resident/BenefitCard";
import { Carousel } from "@/components/resident/Carousel";
import { HeroBanner } from "@/components/resident/HeroBanner";
import { HoursList } from "@/components/resident/HoursList";
import { SavingsCounter } from "@/components/resident/SavingsCounter";
import { heroSlides } from "@/lib/offers/feedSections";
import type { FeedCategory, ResidentOffer } from "@/lib/offers/types";

// Sample data for the gallery only.
const CATEGORIES: FeedCategory[] = [
  { slug: "food", name: "אוכל", icon: "utensils" }, { slug: "bakery", name: "מאפייה", icon: "croissant" },
  { slug: "beauty", name: "ביוטי", icon: "sparkles" }, { slug: "fitness", name: "ספורט", icon: "dumbbell" },
];
const HOURS = { sun: [["08:00", "21:00"]], mon: [["08:00", "21:00"]], fri: [["08:00", "14:00"]], sat: [] } as ResidentOffer["hours"];

/** A sample offer with overrides. */
const sample = (id: string, o: Partial<ResidentOffer>): ResidentOffer => ({
  businessId: id, businessName: "פיצה מרגריטה", category: "food", address: "רוטשילד 60", businessDescription: null, logoUrl: null,
  coverUrl: null, lat: null, lng: null, hours: HOURS, branches: [], title: "10% הנחה על כל התפריט", discountPercent: 10, featured: false,
  description: "", terms: null, startsAt: null, endsAt: null, joinedAt: "2026-07-01T00:00:00Z", distanceMeters: 113,
  recentRedemptions: 13, remaining: null, state: "available", ...o,
});

const OFFERS = [
  sample("a", {}),
  sample("b", { businessName: "מאפיית השכונה", category: "bakery", title: "10% הנחה על כל המאפים", distanceMeters: 657, state: "used" }),
  sample("c", { businessName: "גלידריה קרמל", title: "15% הנחה על גלידה", discountPercent: 15, endsAt: "2026-12-31T21:59:59Z", state: "active" }),
  sample("d", { businessName: "סטודיו ליה ביוטי", category: "beauty", title: "10% הנחה על כל הטיפולים", distanceMeters: 1420 }),
  sample("e", { businessName: "קרוספיט פתח תקווה", category: "fitness", title: "10% הנחה על מנוי חודשי", state: "upcoming", startsAt: "2026-11-04T08:00:00Z" }),
];

/** The resident feed pieces with sample content (the real screens need a signed-in resident). */
export function ResidentSamples() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <HeroBanner slides={heroSlides({ offers: OFFERS, banners: [] })} />
      <SavingsCounter saved={115.3} />
      <Carousel title="החמות ביותר" moreHref="/ui-kit">
        {OFFERS.map((o) => <BenefitCard key={o.businessId} offer={o} categories={CATEGORIES} />)}
      </Carousel>
      <div className="rounded-3xl bg-white p-5 shadow-soft"><HoursList hours={HOURS!} /></div>
    </div>
  );
}
