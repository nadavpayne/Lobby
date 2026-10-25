"use client";

import { Building2, Search, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { searchAll } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { SearchHit } from "@/lib/admin/search";

const ICON = { building: Building2, business: Store, resident: UserRound };
const DEBOUNCE_MS = 250;

/** Top-bar search across buildings, businesses and residents, with a results dropdown. */
export function GlobalSearch({ token }: { token: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let live = true;
    const id = setTimeout(() => searchAll(token, term).then((res) => live && setHits(isApiError(res) ? [] : res)), DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [q, token]);

  const showing = open && q.trim().length >= 2 && hits !== null;
  return (
    <div className="relative max-w-md" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <label className="relative block">
        <span className="sr-only">חיפוש בכל לובי</span>
        <Search aria-hidden className="absolute inset-y-0 start-3 my-auto size-4 text-navy/50" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="חיפוש בניין, עסק או דייר"
          className="min-h-11 w-full rounded-full border border-navy/15 bg-white ps-9 pe-4 outline-none focus:border-navy focus:ring-2 focus:ring-amber"
        />
      </label>
      {showing && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white shadow-lift">
          {hits.length === 0 && <p className="p-4 text-navy/60">לא נמצאו תוצאות</p>}
          <ul>
            {hits.map((h) => {
              const Icon = ICON[h.kind];
              return (
                <li key={`${h.kind}-${h.id}`}>
                  <Link href={h.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream">
                    <Icon aria-hidden className="size-4 shrink-0 text-navy/60" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{h.title}</span>
                      <span className="block truncate text-sm text-navy/60">{h.subtitle}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
