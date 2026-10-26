import type { Point } from "../geo/distance.ts";

const CLUSTER_PX = 56;

/** Groups points that fall in the same ~56 px square at this map zoom (Web Mercator: 256 px per 360° at zoom 0). */
export function clusterPoints<T extends { point: Point }>(items: T[], zoom: number): T[][] {
  const cell = (CLUSTER_PX * 360) / (256 * 2 ** zoom);
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = `${Math.floor(item.point.lat / cell)}:${Math.floor(item.point.lng / cell)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()];
}
