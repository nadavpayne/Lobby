"use client";

import { useEffect, useState } from "react";
import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { fetchMyBuilding } from "@/lib/api/buildings";
import { isApiError } from "@/lib/api/http";
import type { MyBuilding } from "@/lib/buildings/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { BuildingForm } from "./BuildingForm";
import { InviteLink } from "./InviteLink";

const loading = <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;

/** Sign in, then: already in a building → show it (invite link for the committee); otherwise the registration form. */
export function RegisterBuilding() {
  const { supabase, session } = useSupabaseSession();
  const token = session?.access_token;
  const [building, setBuilding] = useState<MyBuilding | null>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    fetchMyBuilding(token).then((res) => {
      if (!live) return;
      if (isApiError(res) && res.unauthorized) supabase?.auth.signOut(); // expired session → back to login
      setError(isApiError(res) && !res.unauthorized ? res.error : null);
      if (!isApiError(res)) setBuilding(res.building);
    });
    return () => {
      live = false;
    };
  }, [token, supabase]);

  if (!supabase) return <p role="alert">Supabase לא מוגדר.</p>;
  if (session === undefined) return loading;
  if (!session) {
    return (
      <EmailCodeLogin
        supabase={supabase}
        shouldCreateUser
        title="רישום הבניין ללובי"
        subtitle="התחברו עם האימייל שלכם. הבניין יירשם על החשבון הזה, ואתם תהיו הוועד שלו באפליקציה."
      />
    );
  }
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (building === undefined) return loading;

  if (building?.inviteUrl) return <InviteLink address={`${building.address}, ${building.city}`} inviteUrl={building.inviteUrl} />;
  if (building) {
    return (
      <p className="rounded-xl bg-white p-5 text-lg">
        החשבון שלך כבר משויך לבניין {building.address}, {building.city} (דירה {building.apartmentNumber}). רק חבר הוועד שרשם את
        הבניין רואה את קישור ההצטרפות.
      </p>
    );
  }
  return <BuildingForm token={session.access_token} onCreated={(created) => setBuilding(created)} />;
}
