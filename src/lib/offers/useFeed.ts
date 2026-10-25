"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isApiError } from "@/lib/api/http";
import { fetchFeed } from "@/lib/api/resident";
import type { Feed } from "./types";

// One feed shared by every resident screen, so switching tabs or opening a business shows data at once.
let cache: { token: string; feed: Feed } | null = null;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** The resident feed: shows the cached copy immediately and refreshes it on mount; reload() after issuing a code. */
export function useFeed(token: string) {
  const cached = useSyncExternalStore(subscribe, () => cache, () => null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetchFeed(token);
    if (isApiError(res)) return setError(res.error);
    setError(null);
    cache = { token, feed: res };
    listeners.forEach((fn) => fn());
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set after the request returns
    reload();
  }, [reload]);

  return { feed: cached?.token === token ? cached.feed : undefined, error, reload };
}
