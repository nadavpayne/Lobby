"use client";

import { useEffect, useState } from "react";
import { fetchMyBusiness, type MyBusiness } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import { signOutDevice } from "@/lib/push/device";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import type { Role } from "./homeFor";
import { useRoles } from "./useRoles";

export interface HomeAccount {
  email: string;
  roles: Role[];
  /** The business this account owns or works at, once loaded (null if none). */
  business: MyBusiness | null | undefined;
  signOut: () => void;
}

/**
 * Who is signed in, for public pages: undefined while loading, null when signed out.
 * Loads the business too when the account has one, for its name and logo.
 */
export function useHomeAccount(): HomeAccount | null | undefined {
  const { supabase, session } = useSupabaseSession();
  const { roles } = useRoles(supabase, session?.access_token);
  const hasBusiness = !!roles?.roles.some((r) => r === "business_owner" || r === "cashier");
  const [business, setBusiness] = useState<{ token: string; value: MyBusiness | null }>();

  useEffect(() => {
    const token = session?.access_token;
    if (!token || !hasBusiness) return;
    let live = true;
    fetchMyBusiness(token).then((res) => live && setBusiness({ token, value: isApiError(res) ? null : res }));
    return () => {
      live = false;
    };
  }, [session?.access_token, hasBusiness]);

  if (!supabase || session === null) return null;
  if (session === undefined || !roles) return undefined;
  return {
    email: session.user.email ?? "",
    roles: roles.roles,
    business: !hasBusiness ? null : business?.token === session.access_token ? business.value : undefined,
    signOut: () => signOutDevice(supabase),
  };
}
