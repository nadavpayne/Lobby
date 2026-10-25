"use client";

import { createContext, useContext, type ReactNode } from "react";
import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { secondaryButton } from "@/components/ui";
import type { MyBuilding } from "@/lib/buildings/types";
import { useMyBuilding } from "@/lib/buildings/useMyBuilding";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { TabBar } from "./TabBar";

interface Resident {
  token: string;
  building: MyBuilding;
  signOut: () => void;
}

const ResidentContext = createContext<Resident | null>(null);

/** The signed-in, approved resident (only inside ResidentGate). */
export function useResident(): Resident {
  const resident = useContext(ResidentContext);
  if (!resident) throw new Error("useResident outside ResidentGate");
  return resident;
}

const loading = <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;

/** Card with a message and a sign-out button, for accounts that can't use the app yet. */
function Blocked({ title, children, onSignOut }: { title: string; children: ReactNode; onSignOut: () => void }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-lg">{children}</p>
      <button type="button" onClick={onSignOut} className={secondaryButton}>יציאה מהחשבון</button>
    </section>
  );
}

/** Resident app gate: email login → must be an approved member → app screens with the tab bar. */
export function ResidentGate({ children }: { children: ReactNode }) {
  const { supabase, session } = useSupabaseSession();
  const { building, error } = useMyBuilding(supabase, session?.access_token);

  if (!supabase || session === undefined) return loading;
  if (!session) {
    return (
      <EmailCodeLogin
        supabase={supabase}
        shouldCreateUser={false}
        title="כניסה ללובי"
        subtitle="לדיירים שכבר הצטרפו דרך קישור הבניין. עוד לא הצטרפתם? בקשו מוועד הבית את הקישור."
      />
    );
  }
  const signOut = () => supabase.auth.signOut();
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (building === undefined) return loading;
  if (!building) {
    return <Blocked title="עוד לא הצטרפתם לבניין" onSignOut={signOut}>כדי להשתמש בלובי פתחו את קישור ההצטרפות שוועד הבית שלח בקבוצת הווטסאפ.</Blocked>;
  }
  if (building.status === "pending") {
    return (
      <Blocked title="ממתינים לאישור" onSignOut={signOut}>
        בדירה {building.apartmentNumber} כבר רשום חשבון. ברגע שהוא או ועד הבית יאשרו אתכם, ההטבות יופיעו כאן.
      </Blocked>
    );
  }

  return (
    <ResidentContext.Provider value={{ token: session.access_token, building, signOut }}>
      {children}
      <TabBar />
    </ResidentContext.Provider>
  );
}
