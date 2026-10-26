"use client";

import { MapPinOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MapView, type MapMarker } from "@/components/address/MapView";
import { useAccount } from "@/components/auth/RoleGate";
import { inputClass } from "@/components/Field";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import type { AdminMap } from "@/lib/admin/map";
import { fetchAdminMap } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import { CATEGORIES, type Category } from "@/lib/businesses/categories";

const ISRAEL = { lat: 32.08, lng: 34.85 };

/** A design-token color the map can paint. */
const token = (name: string) => (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()) || "#ffffff";

/** Which layers are on. Leads = buildings that haven't joined yet: where demand is but Lobby isn't live. */
interface Layers {
  joined: boolean;
  leads: boolean;
  active: boolean;
  prospects: boolean;
}

const LAYER_LABEL: Record<keyof Layers, string> = {
  joined: "בניינים פעילים",
  leads: "בניינים שעוד לא הצטרפו",
  active: "עסקים פעילים",
  prospects: "עסקים בדרך (ליד / ממתין)",
};

/** /admin/map — every building and business on one map: clusters, filters by category and city, coverage gaps. */
export default function AdminMapScreen() {
  const { token: auth } = useAccount();
  const router = useRouter();
  const [data, setData] = useState<AdminMap>();
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [layers, setLayers] = useState<Layers>({ joined: true, leads: true, active: true, prospects: false });

  useEffect(() => {
    let live = true;
    fetchAdminMap(auth).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setData(res);
    });
    return () => {
      live = false;
    };
  }, [auth]);

  const cities = useMemo(() => [...new Set([...(data?.buildings ?? []).map((b) => b.city), ...(data?.businesses ?? []).flatMap((b) => (b.city ? [b.city] : []))])].sort(), [data]);

  const markers = useMemo<MapMarker[]>(() => {
    if (!data) return [];
    const inCity = (c: string | null) => !city || c === city;
    const buildings = data.buildings
      .filter((b) => inCity(b.city) && (b.pipeline === "joined" ? layers.joined : layers.leads))
      .map((b) => ({
        id: b.id, point: { lat: b.lat, lng: b.lng }, title: `${b.name ?? b.address}, ${b.city}`, letter: "ב",
        color: token(b.pipeline === "joined" ? "mint" : "rose"), onClick: () => router.push(`/admin/buildings?focus=${b.id}`),
      }));
    const businesses = data.businesses
      .filter((b) => inCity(b.city) && (!category || b.category === category) && (b.status === "active" ? layers.active : layers.prospects && (b.status === "lead" || b.status === "pending")))
      .map((b) => ({
        id: b.id, point: { lat: b.lat, lng: b.lng }, title: `${b.name} · ${CATEGORIES[b.category as Category] ?? b.category}`, letter: "ע",
        color: token(b.status === "active" ? "amber" : "peach"), onClick: () => router.push(`/admin/businesses?focus=${b.id}`),
      }));
    return [...buildings, ...businesses];
  }, [data, city, category, layers, router]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!data) return <Skeleton className="h-[32rem] w-full rounded-3xl" />;

  const usage = data.usage;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">מפה</h1>
          <p className="text-navy/70">כל הבניינים והעסקים, כדי לראות איפה יש כיסוי ואיפה כדאי לגייס עסקים.</p>
        </div>
        <p className="text-sm text-navy/70">
          Google החודש: {usage.autocomplete.toLocaleString("he-IL")} חיפושי כתובת · {usage.placeDetails.toLocaleString("he-IL")} כתובות שנבחרו
          {usage.textSearch > 0 && ` · ${usage.textSearch.toLocaleString("he-IL")} חיפושי טקסט`} (חינם עד 10,000 מכל סוג)
        </p>
      </header>

      <Card className="flex flex-wrap items-center gap-3">
        <select aria-label="עיר" value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">כל הערים</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="קטגוריה" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">כל הקטגוריות</option>
          {Object.entries(CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {(Object.keys(LAYER_LABEL) as (keyof Layers)[]).map((k) => (
          <label key={k} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} className="size-5 accent-navy" />
            {LAYER_LABEL[k]}
          </label>
        ))}
      </Card>

      {data.buildings.length + data.businesses.length === 0 ? (
        <EmptyState icon={<MapPinOff />} title="עוד אין מקומות על המפה">
          בניינים ועסקים מופיעים כאן אחרי שהכתובת שלהם נבחרה מהרשימה של Google.
        </EmptyState>
      ) : (
        <MapView center={markers[0]?.point ?? ISRAEL} label="כל הבניינים והעסקים" markers={markers} cluster showPin={false} className="h-[32rem]" />
      )}
      <p className="text-sm text-muted">ב = בניין (ירוק: פעיל, ורוד: עוד לא הצטרף) · ע = עסק (כתום: פעיל, אפרסק: בדרך) · מספר = כמה מקומות קרובים, לחצו כדי להתקרב.</p>
    </div>
  );
}
