"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { buttonClass } from "@/components/ui";
import { canOpen, type AppHome } from "@/lib/auth/homeFor";
import { useRoles } from "@/lib/auth/useRoles";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { EmailCodeLogin } from "./EmailCodeLogin";

export interface Account {
  token: string;
  email: string;
  signOut: () => void;
}

const AccountContext = createContext<Account | null>(null);

/** The signed-in account (only inside RoleGate). */
export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount outside RoleGate");
  return account;
}

/** Header + centered column for the screens before the app opens. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-10">{children}</main>
    </>
  );
}

interface Props {
  app: AppHome;
  loginTitle: string;
  /** Let new emails create an account at login (business owners signing in the first time). */
  allowSignUp?: boolean;
  children: ReactNode;
}

/**
 * Opens a CRM app only for accounts with its role: login → roles → app.
 * UX only: every API route checks the role again on the server.
 */
export function RoleGate({ app, loginTitle, allowSignUp = false, children }: Props) {
  const { supabase, session } = useSupabaseSession();
  const { roles, error } = useRoles(session?.access_token);
  const loading = <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;

  if (!supabase) return <Frame><p role="alert">Supabase לא מוגדר: מלאו את המפתחות ב-.env.local.</p></Frame>;
  if (session === undefined) return <Frame>{loading}</Frame>;
  if (!session) return <Frame><EmailCodeLogin supabase={supabase} shouldCreateUser={allowSignUp} title={loginTitle} /></Frame>;
  if (error) return <Frame><p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p></Frame>;
  if (!roles) return <Frame>{loading}</Frame>;

  const signOut = () => supabase.auth.signOut();
  if (!canOpen(roles.roles, app)) {
    return (
      <Frame>
        <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-bold">אין לחשבון הזה גישה לכאן</h1>
          <p className="text-lg">החשבון {session.user.email} לא מורשה למסך הזה.</p>
          {roles.home && <Link href={roles.home} className={buttonClass("primary")}>לאפליקציה שלי</Link>}
          <button type="button" onClick={signOut} className={buttonClass("secondary")}>יציאה מהחשבון</button>
        </section>
      </Frame>
    );
  }

  return (
    <AccountContext.Provider value={{ token: session.access_token, email: session.user.email ?? "", signOut }}>
      {children}
    </AccountContext.Provider>
  );
}
