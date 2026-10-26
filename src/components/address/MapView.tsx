"use client";

import { useEffect, useRef, useState } from "react";
import type { Point } from "@/lib/geo/distance";
import { loadGoogleMaps, MAPS_WEB_KEY } from "@/lib/maps/loadGoogleMaps";

/**
 * Lobby's one map component: a pin on a Google map. With onPinMove the pin can be dragged (business storefront).
 * Swap the SDK here (e.g. native maps in the app) without touching the screens that use it.
 */
export function MapView({ center, label, onPinMove, className = "h-48" }: { center: Point; label: string; onPinMove?: (p: Point) => void; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const marker = useRef<{ setPosition(p: Point): void } | null>(null);
  const map = useRef<{ setCenter(p: Point): void } | null>(null);
  const [failed, setFailed] = useState(false);
  const moveRef = useRef(onPinMove);
  const draggable = !!onPinMove;

  useEffect(() => {
    moveRef.current = onPinMove;
  });

  // Create the map once; later center changes only move it.
  useEffect(() => {
    if (!MAPS_WEB_KEY || map.current) return;
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || !el.current) return;
      map.current = new g.Map(el.current, { center, zoom: 17, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative", clickableIcons: false });
      const m = new g.Marker({ map: map.current, position: center, draggable, title: label });
      m.addListener("dragend", (e) => moveRef.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() }));
      marker.current = m;
    }, () => setFailed(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; the effect below follows center
  }, []);

  useEffect(() => {
    map.current?.setCenter(center);
    marker.current?.setPosition(center);
  }, [center]);

  if (!MAPS_WEB_KEY || failed) return null;
  return <div ref={el} role="img" aria-label={`מפה: ${label}`} className={`w-full overflow-hidden rounded-xl bg-navy/5 ${className}`} />;
}
