"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { fetchRoles, type MyRoles } from "@/lib/api/roles";
import { isApiError } from "@/lib/api/http";

/**
 * My roles for a session token: undefined while loading (or signed out), with an error message on failure.
 * A token the server rejects (expired / revoked) signs the user out, so the page shows the login screen instead of a dead end.
 */
export function useRoles(supabase: SupabaseClient | null, token: string | undefined) {
  const [state, setState] = useState<{ token?: string; roles?: MyRoles; error?: string }>({});

  useEffect(() => {
    if (!token) return;
    let live = true;
    fetchRoles(token).then((res) => {
      if (!live) return;
      if (isApiError(res) && res.unauthorized) return void supabase?.auth.signOut();
      setState(isApiError(res) ? { token, error: res.error } : { token, roles: res });
    });
    return () => {
      live = false;
    };
  }, [supabase, token]);

  // Ignore results that belong to a previous session.
  return state.token === token ? { roles: state.roles, error: state.error } : { roles: undefined, error: undefined };
}
