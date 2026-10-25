import { Navigation } from "lucide-react";
import { buttonClass } from "@/components/ui";

const PAD = 0.004; // ~400 m around the pin

/** Small OpenStreetMap of the business (no API key) and a "navigate with Waze" button. */
export function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const bbox = [lng - PAD, lat - PAD, lng + PAD, lat + PAD].join(",");
  return (
    <div className="flex flex-col gap-3">
      <iframe
        title={`מפה: ${label}`}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        loading="lazy"
        className="h-48 w-full rounded-2xl border-0"
      />
      <a href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
        <Navigation aria-hidden className="size-4" /> ניווט עם Waze
      </a>
    </div>
  );
}
