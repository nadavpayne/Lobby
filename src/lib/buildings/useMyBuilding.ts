"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { fetchMyBuilding } from "@/lib/api/buildings";
import { isApiError } from "@/lib/api/http";
import type { MyBuilding } from "./types";

/**
 * The signed-in user's building: undefined while loading, null if they haven't joined one.
 * A token the server rejects signs the user out, so the page falls back to the login screen.
 */
export function useMyBuilding(supabase: SupabaseClient | null, token: string | undefined) {
  const [building, setBuilding] = useState<MyBuilding | null>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    fetchMyBuilding(token).then((res) => {
      if (!live) return;
      if (isApiError(res) && res.unauthorized) supabase?.auth.signOut();
      setError(isApiError(res) && !res.unauthorized ? res.error : null);
      if (!isApiError(res)) setBuilding(res.building);
    });
    return () => {
      live = false;
    };
  }, [token, supabase]);

  return { building, setBuilding, error };
}
