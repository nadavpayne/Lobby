"use client";

import { useEffect, useRef, useState } from "react";
import type { Point } from "@/lib/geo/distance";
import { clusterPoints } from "@/lib/maps/cluster";
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

const NAVY = "#14254a";

/** Draws one marker, or a numbered circle for a group that zooms in to its members when tapped. */
function draw(g: GoogleMaps, map: GoogleMap, group: MapMarker[]): GoogleMarker {
  if (group.length === 1) {
    const m = group[0];
    const marker = new g.Marker({
      map,
      position: m.point,
      title: m.title,
      label: { text: m.letter, color: NAVY, fontWeight: "700" },
      icon: { path: g.SymbolPath.CIRCLE, scale: 15, fillColor: m.color, fillOpacity: 1, strokeColor: NAVY, strokeWeight: 2 },
    });
    if (m.onClick) marker.addListener("click", m.onClick);
    return marker;
  }
  const bounds = new g.LatLngBounds();
  group.forEach((m) => bounds.extend(m.point));
  const center = { lat: group.reduce((s, m) => s + m.point.lat, 0) / group.length, lng: group.reduce((s, m) => s + m.point.lng, 0) / group.length };
  const cluster = new g.Marker({
    map,
    position: center,
    title: `${group.length} מקומות`,
    label: { text: String(group.length), color: "#ffffff", fontWeight: "700" },
    icon: { path: g.SymbolPath.CIRCLE, scale: 20, fillColor: NAVY, fillOpacity: 0.9, strokeColor: "#ffffff", strokeWeight: 3 },
    zIndex: 5,
  });
  cluster.addListener("click", () => map.fitBounds(bounds, 48));
  return cluster;
}

/**
 * Lobby's one map component: an optional main pin at center, plus optional round markers (the view fits them all;
 * with cluster, nearby ones merge into numbered circles). With onPinMove the main pin can be dragged (business
 * storefront). Swap the SDK here (e.g. native maps in the app) without touching the screens that use it.
 */
export function MapView({ center, label, onPinMove, markers, cluster = false, showPin = true, className = "h-48" }: {
  center: Point;
  label: string;
  onPinMove?: (p: Point) => void;
  markers?: MapMarker[];
  cluster?: boolean;
  showPin?: boolean;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ g: GoogleMaps; map: GoogleMap; pin: GoogleMarker | null } | null>(null);
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
      const pin = showPin ? new g.Marker({ map, position: center, draggable, title: label, zIndex: 10 }) : null;
      pin?.addListener("dragend", (e) => moveRef.current?.({ lat: e!.latLng.lat(), lng: e!.latLng.lng() }));
      setApi({ g, map, pin });
    }, () => setFailed(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once
  }, []);

  useEffect(() => {
    api?.map.setCenter(center);
    api?.pin?.setPosition(center);
  }, [api, center]);

  useEffect(() => {
    if (!api || !markers?.length) return;
    const { g, map } = api;
    const bounds = new g.LatLngBounds();
    if (showPin) bounds.extend(center);
    markers.forEach((m) => bounds.extend(m.point));
    map.fitBounds(bounds, 48);

    let drawn: GoogleMarker[] = [];
    const redraw = () => {
      drawn.forEach((m) => m.setMap(null));
      drawn = (cluster ? clusterPoints(markers, map.getZoom() ?? 17) : markers.map((m) => [m])).map((group) => draw(g, map, group));
    };
    redraw();
    const idle = cluster ? map.addListener("idle", redraw) : null;
    return () => {
      idle?.remove();
      drawn.forEach((m) => m.setMap(null));
    };
  }, [api, markers, center, cluster, showPin]);

  if (!MAPS_WEB_KEY || failed) return null;
  return <div ref={el} role="img" aria-label={`מפה: ${label}`} className={`w-full overflow-hidden rounded-xl bg-navy/5 ${className}`} />;
}
