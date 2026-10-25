"use client";

import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { Loading } from "@/components/ui";
import type { InviteBuilding } from "@/lib/buildings/inviteBuilding";
import { useMyBuilding } from "@/lib/buildings/useMyBuilding";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { ApartmentForm } from "./ApartmentForm";
import { JoinStatus } from "./JoinStatus";

const loading = <Loading />;

/** Invite flow: sign in with email → pick apartment → active or waiting for approval. */
export function JoinBuilding({ inviteSlug, building }: { inviteSlug: string; building: InviteBuilding }) {
  const { supabase, session } = useSupabaseSession();
  const { building: mine, setBuilding, error } = useMyBuilding(supabase, session?.access_token);
  const address = `${building.address}, ${building.city}`;

  if (!supabase) return <p role="alert">Supabase לא מוגדר.</p>;
  if (session === undefined) return loading;
  if (!session) {
    return (
      <EmailCodeLogin
        supabase={supabase}
        shouldCreateUser
        title="מועדון ההטבות של הבניין"
        subtitle={`${address}. התחברו עם האימייל שלכם כדי להצטרף ולקבל 10% הנחה בעסקים בשכונה.`}
      />
    );
  }
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (mine === undefined) return loading;
  if (mine) return <JoinStatus mine={mine} sameBuilding={mine.address === building.address && mine.city === building.city} />;

  return (
    <ApartmentForm
      token={session.access_token}
      inviteSlug={inviteSlug}
      address={address}
      apartmentCount={building.apartmentCount}
      onJoined={(status, apartmentNumber) =>
        setBuilding({ role: "resident", status, apartmentNumber, address: building.address, city: building.city, apartmentCount: building.apartmentCount })
      }
    />
  );
}
