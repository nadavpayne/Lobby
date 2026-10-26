"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapView } from "@/components/address/MapView";
import { Card } from "@/components/ui";
import { fetchReach } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BizReach } from "@/lib/biz/reach";
import { formatDistance } from "@/lib/geo/distance";

/** The business on the map and how many Lobby households live around it (counts only, no addresses). */
export function ReachCard({ token, name }: { token: string; name: string }) {
  const [reach, setReach] = useState<BizReach | null>(null);

  useEffect(() => {
    let live = true;
    fetchReach(token).then((res) => {
      if (live && !isApiError(res)) setReach(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (!reach) return null;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 aria-hidden className="size-5" /> דיירי לובי סביבכם</h2>
      {reach.location ? (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {reach.rings.map((r) => (
              <li key={r.radiusMeters} className="rounded-2xl bg-mint p-3">
                <p className="text-sm">עד {formatDistance(r.radiusMeters)}</p>
                <p className="text-2xl font-bold tabular-nums">{r.apartments.toLocaleString("he-IL")}</p>
                <p className="text-sm">דירות רשומות ב-{r.buildings.toLocaleString("he-IL")} בניינים</p>
              </li>
            ))}
          </ul>
          <MapView center={reach.location} label={name} />
        </>
      ) : (
        <p className="text-navy/70">
          כדי לראות כמה דיירים גרים לידכם, בחרו את כתובת העסק מהרשימה ב<Link href="/biz/profile" className="font-bold underline">פרטי העסק</Link>.
        </p>
      )}
    </Card>
  );
}
