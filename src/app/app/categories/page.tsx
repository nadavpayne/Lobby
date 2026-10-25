"use client";

import { SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BenefitCard } from "@/components/resident/BenefitCard";
import { CategoryIcon, Chip, ChipRow, EmptyState, SkeletonCard } from "@/components/ui";
import { useFeed } from "@/lib/offers/useFeed";
import { useResident } from "../ResidentGate";

/** Chips + every benefit in the chosen category; the choice lives in ?c= so back/share keep it. */
function CategoriesBrowser() {
  const { token } = useResident();
  const { feed, error } = useFeed(token);
  const router = useRouter();
  const selected = useSearchParams().get("c") ?? "all";

  if (error && !feed) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  const visible = feed?.offers.filter((o) => selected === "all" || o.category === selected);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">קטגוריות</h1>
      <ChipRow label="סינון לפי קטגוריה">
        <Chip selected={selected === "all"} onClick={() => router.replace("/app/categories")}>הכל</Chip>
        {feed?.categories.map((c) => (
          <Chip key={c.slug} selected={selected === c.slug} onClick={() => router.replace(`/app/categories?c=${c.slug}`)} icon={<CategoryIcon name={c.icon} />}>
            {c.name}
          </Chip>
        ))}
      </ChipRow>
      {!feed && <div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>}
      {visible?.length === 0 && <EmptyState icon={<SearchX />} title="אין כאן הטבות עדיין">בקרוב יצטרפו עסקים גם בקטגוריה הזאת.</EmptyState>}
      <div className="grid gap-4 sm:grid-cols-2">
        {feed && visible?.map((o) => <BenefitCard key={o.businessId} offer={o} categories={feed.categories} layout="grid" />)}
      </div>
    </div>
  );
}

/** Categories tab. useSearchParams needs a Suspense boundary. */
export default function CategoriesScreen() {
  return (
    <Suspense>
      <CategoriesBrowser />
    </Suspense>
  );
}
