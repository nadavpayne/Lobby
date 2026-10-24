"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getBrowserClient } from "./browser";

/** Browser Supabase client and its live session: undefined while loading, null when signed out. */
export function useSupabaseSession() {
  const supabase = getBrowserClient();
  const [session, setSession] = useState<Session | null>();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return { supabase, session };
}
