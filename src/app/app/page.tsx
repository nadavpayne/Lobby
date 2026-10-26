"use client";

import { MapPin, Store } from "lucide-react";
import Link from "next/link";
import { PullToRefresh } from "@/components/native/PullToRefresh";
import { PushPrompt } from "@/components/native/PushPrompt";
import { BenefitCard } from "@/components/resident/BenefitCard";
import { BenefitSearch } from "@/components/resident/BenefitSearch";
import { Carousel } from "@/components/resident/Carousel";
import { HeroBanner } from "@/components/resident/HeroBanner";
import { SavingsCounter } from "@/components/resident/SavingsCounter";
import { EmptyState, Skeleton, SkeletonCard } from "@/components/ui";
import { feedSections, heroSlides, type FeedSection } from "@/lib/offers/feedSections";
import { useFeed } from "@/lib/offers/useFeed";
import { useResident } from "./ResidentGate";

// "See more" links per carousel.
const MORE: Partial<Record<FeedSection["key"], { moreHref: string; moreLabel?: string }>> = {
  permanent: { moreHref: "/app/categories" },
  near: { moreHref: "/app/map", moreLabel: "מפה" },
};

/** Placeholder while the feed loads. */
function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="טוען הטבות">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="flex gap-2"><Skeleton className="h-11 w-24 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /></div>
      <div className="flex gap-3 overflow-hidden"><div className="w-72 shrink-0"><SkeletonCard /></div><div className="w-72 shrink-0"><SkeletonCard /></div></div>
    </div>
  );
}

/** Home: search and category picker, then hero, savings and the benefit carousels for my building. */
export default function HomeScreen() {
  const { token, building } = useResident();
  const { feed, error, reload } = useFeed(token);

  if (error && !feed) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!feed) return <FeedSkeleton />;
  if (feed.offers.length === 0) {
    return (
      <EmptyState icon={<Store />} title="ההטבות בדרך">
        עוד אין עסקים פעילים ב{building.city}. אנחנו מצרפים עכשיו עסקים בשכונה, וההטבות יופיעו כאן.
      </EmptyState>
    );
  }

  return (
    <div className="flex animate-pop-in flex-col gap-6">
      <PullToRefresh onRefresh={reload} />
      <BenefitSearch
        offers={feed.offers}
        categories={feed.categories}
        lead={feed.home && (
          <Link href="/app/map" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-navy px-4 font-medium text-cream transition active:scale-95">
            <MapPin aria-hidden className="size-4" /> ליד הבית
          </Link>
        )}
      >
        <HeroBanner slides={heroSlides(feed)} />
        <SavingsCounter saved={feed.savedTotal} />
        <PushPrompt token={token} text="נשלח התראה כשעסק ליד הבית מצטרף ללובי, וכשמימוש שלכם הושלם בקופה." />
        {feedSections(feed.offers).map((s) => (
          <Carousel key={s.key} title={s.title} {...MORE[s.key]}>
            {s.offers.map((o) => <BenefitCard key={o.businessId} offer={o} categories={feed.categories} />)}
          </Carousel>
        ))}
      </BenefitSearch>
    </div>
  );
}
