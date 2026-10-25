"use client";

import { ChevronRight, Clock, MapPin, SearchX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BusinessCover, BusinessLogo } from "@/components/resident/BusinessCover";
import { categoryStyle } from "@/components/resident/categoryStyle";
import { HoursList } from "@/components/resident/HoursList";
import { MapEmbed } from "@/components/resident/MapEmbed";
import { OfferTags } from "@/components/resident/OfferTags";
import { buttonClass, Card, EmptyState, Skeleton } from "@/components/ui";
import { todayLine } from "@/lib/offers/hours";
import { useFeed } from "@/lib/offers/useFeed";
import { useResident } from "../../ResidentGate";
import { RedeemBar } from "./RedeemBar";

/** Business page: cover, the offer and its terms, address + map, hours, and "use benefit" with this month's status. */
export default function BusinessScreen() {
  const { businessId } = useParams<{ businessId: string }>();
  const { token, building } = useResident();
  const { feed, error, reload } = useFeed(token);

  if (error && !feed) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!feed) return <div className="flex flex-col gap-4"><Skeleton className="h-52 w-full rounded-3xl" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-24 w-full rounded-3xl" /></div>;

  const o = feed.offers.find((x) => x.businessId === businessId);
  if (!o) {
    return (
      <EmptyState icon={<SearchX />} title="ההטבה לא נמצאה" action={<Link href="/app" className={buttonClass("primary", "md")}>לכל ההטבות</Link>}>
        ייתכן שהעסק הפסיק את ההטבה או שהוא לא פעיל באזור הבניין שלכם.
      </EmptyState>
    );
  }
  const style = categoryStyle(feed.categories, o.category);

  return (
    <article className="-mt-5 flex animate-pop-in flex-col gap-5">
      <div className="relative -mx-4">
        <BusinessCover coverUrl={o.coverUrl} icon={style.icon} tint={style.tint} className="h-56 w-full" />
        <Link href="/app" aria-label="חזרה" className="absolute top-3 start-3 grid size-11 place-items-center rounded-full bg-white/90 shadow-soft">
          <ChevronRight aria-hidden className="size-5" />
        </Link>
        <BusinessLogo name={o.businessName} logoUrl={o.logoUrl} className="absolute -bottom-8 start-4 size-16 text-2xl" />
      </div>

      <header className="flex flex-col gap-2 pt-6">
        <p className="text-navy/60">{o.businessName} · {style.name}</p>
        <h1 className="text-3xl leading-tight font-bold">{o.title}</h1>
        <OfferTags offer={o} />
      </header>

      <RedeemBar offer={o} token={token} address={`${building.address}, ${building.city}`} onRedeemed={reload} />

      <Card className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">מה כולל</h2>
        <p>{o.description}</p>
        {o.terms && <p className="text-sm text-navy/70">תנאים: {o.terms}</p>}
        <p className="text-sm text-navy/70">הטבה אחת לדירה בחודש, בהצגת הקוד בקופה לפני התשלום.</p>
      </Card>

      {o.businessDescription && (
        <Card tint={style.tint} className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">על {o.businessName}</h2>
          <p>{o.businessDescription}</p>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin aria-hidden className="size-5" /> איפה</h2>
        {o.branches.length > 1 ? (
          <ul className="flex flex-col gap-1">{o.branches.map((b) => <li key={b.name}><span className="font-medium">{b.name}</span> · {b.address}</li>)}</ul>
        ) : (
          <p>{o.address}</p>
        )}
        {o.lat !== null && o.lng !== null && <MapEmbed lat={o.lat} lng={o.lng} label={o.businessName} />}
      </Card>

      {o.hours && (
        <Card className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Clock aria-hidden className="size-5" /> שעות פתיחה · <span className="font-normal">{todayLine(o.hours)}</span></h2>
          <HoursList hours={o.hours} />
        </Card>
      )}
    </article>
  );
}
