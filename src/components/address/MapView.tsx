"use client";

import { useEffect, useRef, useState } from "react";
import type { Point } from "@/lib/geo/distance";
import { loadGoogleMaps, MAPS_WEB_KEY, type GoogleMap, type GoogleMaps, type GoogleMarker } from "@/lib/maps/loadGoogleMaps";

/** A round pin with a letter (e.g. a business, colored by its category); tapping it calls onClick. */
export interface MapMarker {
  id: string;
  point: Point;
  title: string;
  letter: string;
  color: string;
  onClick?: () => void;
}

/**
 * Lobby's one map component: the main pin at center, plus optional round markers (the view fits them all).
 * With onPinMove the main pin can be dragged (business storefront). Swap the SDK here (e.g. native maps in the
 * app) without touching the screens that use it.
 */
export function MapView({ center, label, onPinMove, markers, className = "h-48" }: {
  center: Point;
  label: string;
  onPinMove?: (p: Point) => void;
  markers?: MapMarker[];
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ g: GoogleMaps; map: GoogleMap; pin: GoogleMarker } | null>(null);
  const [failed, setFailed] = useState(false);
  const moveRef = useRef(onPinMove);
  const draggable = !!onPinMove;

  useEffect(() => {
    moveRef.current = onPinMove;
  });

  // Create the map once; the effects below follow center and markers.
  useEffect(() => {
    if (!MAPS_WEB_KEY) return;
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || !el.current) return;
      const map = new g.Map(el.current, { center, zoom: 17, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative", clickableIcons: false });
      const pin = new g.Marker({ map, position: center, draggable, title: label, zIndex: 10 });
      pin.addListener("dragend", (e) => moveRef.current?.({ lat: e!.latLng.lat(), lng: e!.latLng.lng() }));
      setApi({ g, map, pin });
    }, () => setFailed(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once
  }, []);

  useEffect(() => {
    api?.map.setCenter(center);
    api?.pin.setPosition(center);
  }, [api, center]);

  useEffect(() => {
    if (!api || !markers?.length) return;
    const { g, map } = api;
    const bounds = new g.LatLngBounds();
    bounds.extend(center);
    const made = markers.map((m) => {
      bounds.extend(m.point);
      const marker = new g.Marker({
        map,
        position: m.point,
        title: m.title,
        label: { text: m.letter, color: "#14254a", fontWeight: "700" },
        icon: { path: g.SymbolPath.CIRCLE, scale: 15, fillColor: m.color, fillOpacity: 1, strokeColor: "#14254a", strokeWeight: 2 },
      });
      if (m.onClick) marker.addListener("click", m.onClick);
      return marker;
    });
    map.fitBounds(bounds, 48);
    return () => made.forEach((m) => m.setMap(null));
  }, [api, markers, center]);

  if (!MAPS_WEB_KEY || failed) return null;
  return <div ref={el} role="img" aria-label={`מפה: ${label}`} className={`w-full overflow-hidden rounded-xl bg-navy/5 ${className}`} />;
}
