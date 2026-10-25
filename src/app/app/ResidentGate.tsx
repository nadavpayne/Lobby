"use client";

import { Building2, House, LayoutGrid, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { ResidentShell } from "@/components/shell/ResidentShell";
import type { NavItem } from "@/components/shell/types";
import { secondaryButton } from "@/components/ui";
import type { MyBuilding } from "@/lib/buildings/types";
import { useMyBuilding } from "@/lib/buildings/useMyBuilding";
import { useSupabaseSession } from "@/lib/supabase/useSession";

interface Resident {
  token: string;
  building: MyBuilding;
  signOut: () => void;
}

const NAV: NavItem[] = [
  { href: "/app", label: "בית", icon: House },
  { href: "/app/categories", label: "קטגוריות", icon: LayoutGrid },
  { href: "/app/wallet", label: "הארנק שלי", icon: Wallet },
  { href: "/app/building", label: "הבניין", icon: Building2 },
  { href: "/app/profile", label: "פרופיל", icon: UserRound },
];

const ResidentContext = createContext<Resident | null>(null);

/** The signed-in, approved resident (only inside ResidentGate). */
export function useResident(): Resident {
  const resident = useContext(ResidentContext);
  if (!resident) throw new Error("useResident outside ResidentGate");
  return resident;
}

const loading = <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;

/** Plain header + content column for the screens before the app opens (login, waiting, errors). */
function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-10">{children}</main>
    </>
  );
}

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

type Gate = { ready: true; resident: Resident } | { ready: false; screen: ReactNode };
const blocked = (screen: ReactNode): Gate => ({ ready: false, screen });

/** Works out whether the app can open; if not, the screen to show instead. */
function useGate(): Gate {
  const { supabase, session } = useSupabaseSession();
  const { building, error } = useMyBuilding(supabase, session?.access_token);

  if (!supabase || session === undefined) return blocked(loading);
  if (!session) {
    return blocked(
      <EmailCodeLogin
        supabase={supabase}
        shouldCreateUser={false}
        title="כניסה ללובי"
        subtitle="לדיירים שכבר הצטרפו דרך קישור הבניין. עוד לא הצטרפתם? בקשו מוועד הבית את הקישור."
      />,
    );
  }
  const signOut = () => supabase.auth.signOut();
  if (error) return blocked(<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>);
  if (building === undefined) return blocked(loading);
  if (!building) {
    return blocked(
      <Blocked title="עוד לא הצטרפתם לבניין" onSignOut={signOut}>
        כדי להשתמש בלובי פתחו את קישור ההצטרפות שוועד הבית שלח בקבוצת הווטסאפ.{" "}
        <Link href="/start" className="font-bold underline">יש לכם חשבון עסק או ניהול?</Link>
      </Blocked>,
    );
  }
  if (building.status === "blocked") {
    return blocked(<Blocked title="החשבון חסום" onSignOut={signOut}>החשבון הזה הושעה על ידי צוות לובי. לפרטים פנו אלינו.</Blocked>);
  }
  if (building.status === "pending") {
    return blocked(
      <Blocked title="ממתינים לאישור" onSignOut={signOut}>
        בדירה {building.apartmentNumber} כבר רשום חשבון. ברגע שהוא או ועד הבית יאשרו אתכם, ההטבות יופיעו כאן.
      </Blocked>,
    );
  }
  return { ready: true, resident: { token: session.access_token, building, signOut } };
}

/** Resident app gate: email login → must be an approved member → app screens in the resident shell. */
export function ResidentGate({ children }: { children: ReactNode }) {
  const gate = useGate();
  if (!gate.ready) return <Frame>{gate.screen}</Frame>;
  return (
    <ResidentContext.Provider value={gate.resident}>
      <ResidentShell nav={NAV} buildingName={gate.resident.building.name ?? gate.resident.building.address}>{children}</ResidentShell>
    </ResidentContext.Provider>
  );
}
