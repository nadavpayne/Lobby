"use client";

import { ChevronLeft, MapPinOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { MapView, type MapMarker } from "@/components/address/MapView";
import { categoryStyle } from "@/components/resident/categoryStyle";
import { CategoryIcon, EmptyState, Skeleton } from "@/components/ui";
import { formatDistance } from "@/lib/geo/distance";
import { useFeed } from "@/lib/offers/useFeed";
import { useResident } from "../ResidentGate";

/** The category's tint as a color the map can paint (read from the design tokens). */
const tintColor = (tint: string) =>
  (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(`--color-${tint}`).trim()) || "#ffffff";

/** /app/map — my building and the businesses within my radius: pins by category, and the same list by distance. */
export default function MapScreen() {
  const { token, building } = useResident();
  const { feed, error } = useFeed(token);
  const router = useRouter();

  const near = useMemo(
    () => (feed?.offers ?? []).filter((o) => o.withinRadius).sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0)),
    [feed],
  );
  const markers = useMemo<MapMarker[]>(
    () =>
      near.flatMap((o) => {
        if (o.lat === null || o.lng === null) return [];
        const style = categoryStyle(feed!.categories, o.category);
        return [{ id: o.businessId, point: { lat: o.lat, lng: o.lng }, title: `${o.businessName}: ${o.title}`, letter: style.name.slice(0, 1) || "•", color: tintColor(style.tint), onClick: () => router.push(`/app/b/${o.businessId}`) }];
      }),
    [near, feed, router],
  );

  if (error && !feed) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!feed) return <Skeleton className="h-80 w-full rounded-3xl" />;
  if (!feed.home) {
    return (
      <EmptyState icon={<MapPinOff />} title="הבניין עוד לא על המפה">
        הכתובת של הבניין עוד לא אומתה. ההטבות עדיין זמינות לכם במסך הבית.
      </EmptyState>
    );
  }

  return (
    <div className="flex animate-pop-in flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">ליד הבניין</h1>
        <p className="text-navy/70">עסקים עד {formatDistance(feed.radiusMeters)} מ{building.address}</p>
      </header>
      <MapView center={feed.home} label={`הבניין שלי: ${building.address}`} markers={markers} className="h-80" />
      {near.length === 0 ? (
        <p className="rounded-2xl bg-white p-4">עוד אין עסקים בלובי במרחק הליכה מהבניין. כל ההטבות בעיר נמצאות במסך הבית.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {near.map((o) => {
            const style = categoryStyle(feed.categories, o.category);
            return (
              <li key={o.businessId}>
                <Link href={`/app/b/${o.businessId}`} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-${style.tint}`}><CategoryIcon name={style.icon} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold">{o.businessName}</span>
                    <span className="truncate text-sm text-navy/70">{o.title}</span>
                  </span>
                  {o.distanceMeters !== null && <span className="shrink-0 text-sm font-medium">{formatDistance(o.distanceMeters)}</span>}
                  <ChevronLeft aria-hidden className="size-5 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
