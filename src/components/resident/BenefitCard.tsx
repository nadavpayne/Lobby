import { CheckCircle2, Ticket } from "lucide-react";
import Link from "next/link";
import type { FeedCategory, ResidentOffer } from "@/lib/offers/types";
import { BusinessCover, BusinessLogo } from "./BusinessCover";
import { categoryStyle } from "./categoryStyle";
import { OfferTags } from "./OfferTags";

interface Props {
  offer: ResidentOffer;
  categories: FeedCategory[];
  /** "carousel" = fixed width for horizontal rows; "grid" = fills its column. */
  layout?: "carousel" | "grid";
}

/** Big rounded benefit card: cover, logo, discount badge, bold headline, tags. Opens the business page. */
export function BenefitCard({ offer: o, categories, layout = "carousel" }: Props) {
  const style = categoryStyle(categories, o.category);
  return (
    <Link
      href={`/app/b/${o.businessId}`}
      className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition hover:shadow-lift active:scale-[0.98] ${layout === "carousel" ? "w-72 shrink-0 snap-start" : ""}`}
    >
      <div className="relative">
        <BusinessCover coverUrl={o.coverUrl} icon={style.icon} tint={style.tint} className="h-36 w-full" />
        <span className="absolute top-3 start-3 rounded-full bg-amber px-3 py-1 text-lg font-bold text-navy shadow-soft">
          <bdi dir="ltr">{o.discountPercent}%</bdi>
        </span>
        {o.state === "used" && (
          <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-sm font-medium">
            <CheckCircle2 aria-hidden className="size-4 text-emerald-700" /> {o.benefitType === "one_time" ? "מומש" : "מומש החודש"}
          </span>
        )}
        {o.state === "active" && (
          <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-sm font-medium text-cream">
            <Ticket aria-hidden className="size-4" /> קוד פעיל
          </span>
        )}
        <BusinessLogo name={o.businessName} logoUrl={o.logoUrl} className="absolute -bottom-6 end-4 size-12" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <p className="text-sm text-muted">{o.businessName} · {style.name}</p>
        <h3 className="text-lg leading-snug font-bold">{o.title}</h3>
        <div className="mt-auto pt-1"><OfferTags offer={o} /></div>
      </div>
    </Link>
  );
}
