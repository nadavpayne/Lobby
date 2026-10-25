"use client";

import { HandCoins, Home, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { StatTile } from "@/components/ui";
import { fetchBuildingStats } from "@/lib/api/committee";
import { isApiError } from "@/lib/api/http";
import type { BuildingStats } from "@/lib/buildings/types";
import { formatShekels } from "@/lib/redemptions/money";

/** Committee dashboard tiles: apartments joined, members, this month's redemptions and savings. */
export function BuildingStatsCard({ token }: { token: string }) {
  const [stats, setStats] = useState<BuildingStats>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchBuildingStats(token).then((res) => {
      if (!live) return;
      setError(isApiError(res) ? res.error : null);
      if (!isApiError(res)) setStats(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!stats) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">הבניין החודש</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatTile tint="sky" icon={<Home />} label="דירות שהצטרפו" value={`${stats.apartmentsJoined}/${stats.apartmentsTotal}`} />
        <StatTile tint="lilac" icon={<Users />} label="חשבונות פעילים" value={stats.members} />
        <StatTile tint="peach" icon={<Ticket />} label="מימושים החודש" value={stats.redemptionsThisMonth} />
        <StatTile tint="mint" icon={<HandCoins />} label="הדיירים חסכו" value={<bdi dir="ltr">{formatShekels(stats.savedThisMonth)}</bdi>} />
      </div>
    </section>
  );
}
