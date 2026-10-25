"use client";

import { Plus, Store } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Button, Chip, ChipRow, EmptyState, Skeleton } from "@/components/ui";
import { fetchAdminBusinesses, fetchDisputeSignals } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { DisputeSignal } from "@/lib/disputes/types";
import { currentPeriod } from "@/lib/period";
import { sortForReview } from "@/lib/admin/sortBusinesses";
import type { AdminBusiness } from "@/lib/admin/types";
import type { BusinessStatus } from "@/lib/businesses/types";
import { BusinessRow, STAGE_LABEL } from "./BusinessRow";
import { LeadForm } from "./LeadForm";

type Filter = BusinessStatus | "review" | null;
const needsReview = (b: AdminBusiness) => b.status !== "declined" && b.offers.some((o) => !o.approved && o.active);

/** Businesses: pipeline (lead → negotiating → live → paused), contract rates, and the offer approval queue. */
function BusinessesScreen() {
  const { token } = useAccount();
  const params = useSearchParams();
  const focus = params.get("focus");
  const [list, setList] = useState<AdminBusiness[]>();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(params.get("filter") === "review" ? "review" : null);
  const [adding, setAdding] = useState(false);
  const [signals, setSignals] = useState<Map<string, DisputeSignal>>(new Map());

  useEffect(() => {
    fetchDisputeSignals(token, currentPeriod()).then((res) => !isApiError(res) && setSignals(new Map(res.map((s) => [s.businessId, s]))));
  }, [token]);

  useEffect(() => {
    let live = true;
    fetchAdminBusinesses(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setList(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  /** Replaces (or adds) a business in the list. */
  const upsert = (b: AdminBusiness) => setList((l) => (l?.some((x) => x.id === b.id) ? l.map((x) => (x.id === b.id ? b : x)) : [b, ...(l ?? [])]));

  const visible = list && sortForReview(list).filter((b) => !filter || (filter === "review" ? needsReview(b) : b.status === filter));
  const count = (f: Filter) => list?.filter((b) => (f === "review" ? needsReview(b) : b.status === f)).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">עסקים</h1>
        <Button size="md" onClick={() => setAdding(true)}><Plus aria-hidden className="size-5" /> עסק חדש</Button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      <ChipRow label="סינון">
        <Chip selected={!filter} onClick={() => setFilter(null)}>הכל {list && `(${list.length})`}</Chip>
        <Chip selected={filter === "review"} onClick={() => setFilter("review")}>עסקים מחכים לאישור ({count("review")})</Chip>
        {(["lead", "pending", "active", "paused", "declined"] as const).map((s) => <Chip key={s} selected={filter === s} onClick={() => setFilter(s)}>{STAGE_LABEL[s]} ({count(s)})</Chip>)}
      </ChipRow>
      {!list && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {visible?.length === 0 && <EmptyState icon={<Store />} title="אין עסקים כאן" />}
      <div className="flex flex-col gap-3">
        {visible?.map((b) => <BusinessRow key={b.id} token={token} business={b} focused={b.id === focus} onChanged={upsert} signal={signals.get(b.id)} />)}
      </div>
      <LeadForm token={token} open={adding} onClose={() => setAdding(false)} onAdded={(b) => { upsert(b); setAdding(false); }} />
    </div>
  );
}

/** useSearchParams needs a Suspense boundary. */
export default function BusinessesPage() {
  return <Suspense><BusinessesScreen /></Suspense>;
}
