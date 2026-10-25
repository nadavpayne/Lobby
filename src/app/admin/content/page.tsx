"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Skeleton } from "@/components/ui";
import { fetchAdminBusinesses, fetchBuildings, fetchContent } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { ContentData } from "@/lib/admin/content";
import { BannersCard } from "./BannersCard";
import { CategoriesCard } from "./CategoriesCard";
import { NotifyCard } from "./NotifyCard";

interface Options {
  businesses: { id: string; name: string }[];
  buildings: { id: string; name: string }[];
  cities: string[];
}

/** Content: hero banners, category chips, announcements to residents. (Featured offers are starred on the businesses screen.) */
export default function ContentScreen() {
  const { token } = useAccount();
  const [data, setData] = useState<ContentData>();
  const [options, setOptions] = useState<Options>({ businesses: [], buildings: [], cities: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([fetchContent(token), fetchAdminBusinesses(token), fetchBuildings(token)]).then(([content, biz, bld]) => {
      if (!live) return;
      if (isApiError(content)) return setError(content.error);
      setData(content);
      const joined = isApiError(bld) ? [] : bld.filter((b) => b.pipeline === "joined");
      setOptions({
        businesses: isApiError(biz) ? [] : biz.filter((b) => !b.isDemo && b.status === "active").map((b) => ({ id: b.id, name: b.name })),
        buildings: joined.map((b) => ({ id: b.id, name: b.name ?? b.address })),
        cities: [...new Set(joined.map((b) => b.city))],
      });
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!data) return <Skeleton className="h-96 w-full rounded-3xl" />;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">תוכן</h1>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <BannersCard token={token} banners={data.banners} businesses={options.businesses} onChanged={setData} />
          <CategoriesCard token={token} categories={data.categories} onChanged={setData} />
        </div>
        <NotifyCard token={token} sent={data.notifications} cities={options.cities} buildings={options.buildings} onChanged={setData} />
      </div>
    </div>
  );
}
