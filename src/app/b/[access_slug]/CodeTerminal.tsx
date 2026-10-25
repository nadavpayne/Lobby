"use client";

import { useMemo, useState } from "react";
import { RegisterFlow } from "@/components/register/RegisterFlow";
import { terminalRegister } from "@/lib/api/register";
import { STATUS_NOTICE } from "@/lib/businesses/statusNotice";
import type { Session } from "./BusinessTerminal";
import { DemoReset } from "./DemoReset";

/** Signed-in staff terminal: the shared register flow (scan → bill → approve), plus the demo reset for sales meetings. */
export function CodeTerminal({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const api = useMemo(() => terminalRegister(session.token), [session.token]);
  const [round, setRound] = useState(0); // remounts the flow after a demo reset

  return (
    <div className="flex flex-col gap-4">
      {session.status !== "active" && <p className="rounded-xl bg-peach p-4">{STATUS_NOTICE[session.status]}</p>}
      <RegisterFlow key={round} api={api} businessName={session.name} station="קופה" onSignOut={onLogout} onUnauthorized={onLogout} />
      {session.isDemo && <DemoReset token={session.token} onReset={() => setRound((n) => n + 1)} onUnauthorized={onLogout} />}
    </div>
  );
}
