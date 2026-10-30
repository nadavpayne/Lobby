import { CalendarClock, Clock, MapPin, Repeat, Sparkles, Store } from "lucide-react";
import { Tag } from "@/components/ui";
import { formatDistance } from "@/lib/geo/distance";
import type { ResidentOffer } from "@/lib/offers/types";

const dayMonth = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", timeZone: "Asia/Jerusalem" });

/** "31.12" in Israel time. */
export const shortDate = (iso: string) => dayMonth.format(new Date(iso));

/** The small tags under a benefit: dates, where to redeem, distance from my building. */
export function OfferTags({ offer: o }: { offer: ResidentOffer }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {o.benefitType === "one_time" ? <Tag tint="lilac" icon={<Sparkles />}>הטבה חד־פעמית</Tag> : <Tag tint="peach" icon={<Repeat />}>כל חודש</Tag>}
      {o.state === "upcoming" && o.startsAt && <Tag tint="lilac" icon={<CalendarClock />}>נפתח ב-{shortDate(o.startsAt)}</Tag>}
      {o.endsAt && <Tag tint="rose" icon={<Clock />}>מסתיים ב-{shortDate(o.endsAt)}</Tag>}
      <Tag tint="sky" icon={<Store />}>למימוש בסניף</Tag>
      {o.distanceMeters !== null && <Tag tint="mint" icon={<MapPin />}>{formatDistance(o.distanceMeters)}</Tag>}
    </div>
  );
}
