"use client";

import { useEffect, useState } from "react";
import { fetchRoles, type MyRoles } from "@/lib/api/roles";
import { isApiError } from "@/lib/api/http";

/** My roles for a session token: undefined while loading (or signed out), with an error message on failure. */
export function useRoles(token: string | undefined) {
  const [state, setState] = useState<{ token?: string; roles?: MyRoles; error?: string }>({});

  useEffect(() => {
    if (!token) return;
    let live = true;
    fetchRoles(token).then((res) => {
      if (live) setState(isApiError(res) ? { token, error: res.error } : { token, roles: res });
    });
    return () => {
      live = false;
    };
  }, [token]);

  // Ignore results that belong to a previous session.
  return state.token === token ? { roles: state.roles, error: state.error } : { roles: undefined, error: undefined };
}
