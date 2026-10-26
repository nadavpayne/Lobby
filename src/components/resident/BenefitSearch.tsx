"use client";

import { Search, SearchX, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BenefitCard } from "@/components/resident/BenefitCard";
import { CategoryIcon, Chip, ChipRow, EmptyState } from "@/components/ui";
import { CATEGORIES, CATEGORY_ICONS, SUBCATEGORIES } from "@/lib/businesses/categories";
import { searchOffers } from "@/lib/offers/search";
import type { FeedCategory, ResidentOffer } from "@/lib/offers/types";

interface Props {
  offers: ResidentOffer[];
  categories: FeedCategory[];
  /** Shown first in the category row (the "near home" map chip). */
  lead?: ReactNode;
  /** The normal home (hero, carousels), shown while nothing is searched or picked. */
  children: ReactNode;
}

/**
 * Home search: free words (business, food, service, street…) and the business categories (the same list as business
 * sign-up), then that category's subcategories. While searching, the results replace the normal home.
 */
export function BenefitSearch({ offers, categories, lead, children }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const active = query.trim() !== "" || category !== null;
  const results = active ? searchOffers(offers, { query, category, subcategory }) : [];

  /** Picks a category (or clears it); a new category clears the subcategory. */
  const pick = (id: string | null) => {
    setCategory(id === category ? null : id);
    setSubcategory(null);
  };

  return (
    <>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute inset-y-0 start-4 my-auto size-5 text-navy/50" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש: פיצה, מספרה, קפה, שם של עסק…"
          aria-label="חיפוש הטבות"
          enterKeyHint="search"
          className="min-h-13 w-full rounded-full border border-navy/15 bg-white ps-12 pe-12 text-lg shadow-soft outline-none focus:border-navy focus:ring-2 focus:ring-amber [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="ניקוי החיפוש" className="absolute inset-y-0 end-2 my-auto grid size-10 place-items-center rounded-full hover:bg-navy/5">
            <X aria-hidden className="size-5" />
          </button>
        )}
      </div>

      <ChipRow label="קטגוריות">
        {lead}
        {Object.entries(CATEGORIES).map(([id, label]) => (
          <Chip key={id} selected={category === id} onClick={() => pick(id)} icon={<CategoryIcon name={CATEGORY_ICONS[id] ?? "store"} />}>
            {label}
          </Chip>
        ))}
      </ChipRow>
      {category && (SUBCATEGORIES[category]?.length ?? 0) > 0 && (
        <ChipRow label={`סוג ב${CATEGORIES[category]}`}>
          <Chip selected={subcategory === null} onClick={() => setSubcategory(null)} className="min-h-9 text-sm">הכל</Chip>
          {SUBCATEGORIES[category].map((s) => (
            <Chip key={s.id} selected={subcategory === s.id} onClick={() => setSubcategory(subcategory === s.id ? null : s.id)} className="min-h-9 text-sm">
              {s.label}
            </Chip>
          ))}
        </ChipRow>
      )}

      {!active && children}
      {active && (
        <section aria-live="polite" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{results.length === 0 ? "אין תוצאות" : `${results.length} ${results.length === 1 ? "הטבה" : "הטבות"}`}</h2>
            <button type="button" onClick={() => { setQuery(""); pick(null); }} className="min-h-11 px-2 font-medium underline">ניקוי</button>
          </div>
          {results.length === 0 ? (
            <EmptyState icon={<SearchX />} title="לא מצאנו הטבה כזאת">נסו מילה אחרת או קטגוריה אחרת. עסקים חדשים מצטרפים כל הזמן.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((o) => <BenefitCard key={o.businessId} offer={o} categories={categories} layout="grid" />)}
            </div>
          )}
        </section>
      )}
    </>
  );
}
