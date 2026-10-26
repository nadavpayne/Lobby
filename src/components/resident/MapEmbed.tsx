import { Navigation } from "lucide-react";
import { MapView } from "@/components/address/MapView";
import { buttonClass } from "@/components/ui";

/** Small Google map of the business and a "navigate with Waze" button (Google's terms: Places data only on a Google map). */
export function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return (
    <div className="flex flex-col gap-3">
      <MapView center={{ lat, lng }} label={label} />
      <a href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
        <Navigation aria-hidden className="size-4" /> ניווט עם Waze
      </a>
    </div>
  );
}
