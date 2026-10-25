"use client";

import { useMemo, useState } from "react";
import { CodeEntry } from "@/components/redeem/CodeEntry";
import { RedeemedCard } from "@/components/redeem/RedeemedCard";
import { ResultCard } from "@/components/redeem/ResultCard";
import { terminalRedeemApi } from "@/lib/api/redeemApi";
import { STATUS_NOTICE } from "@/lib/businesses/statusNotice";
import type { RedeemResult, VerifyResult } from "@/lib/redemptions/types";
import type { Session } from "./BusinessTerminal";
import { DemoReset } from "./DemoReset";

type Step =
  | { kind: "code" }
  | { kind: "result"; code: string; result: VerifyResult }
  | { kind: "done"; result: Extract<RedeemResult, { status: "redeemed" }> };

/** Signed-in terminal: enter/scan code → result (+ amount) → confirmation → next code. */
export function CodeTerminal({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "code" });
  const next = () => setStep({ kind: "code" });
  const api = useMemo(() => terminalRedeemApi(session.token), [session.token]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold">{session.name}</p>
        <button type="button" onClick={onLogout} className="min-h-11 px-2 text-navy/70 underline">
          יציאה
        </button>
      </div>

      {session.status !== "active" && <p className="rounded-xl bg-amber/20 p-4">{STATUS_NOTICE[session.status]}</p>}

      {step.kind === "code" && (
        <CodeEntry api={api} onUnauthorized={onLogout} onResult={(code, result) => setStep({ kind: "result", code, result })} />
      )}
      {step.kind === "result" && (
        <ResultCard
          api={api}
          code={step.code}
          result={step.result}
          onUnauthorized={onLogout}
          onBack={next}
          onRedeemed={(result) =>
            result.status === "redeemed" ? setStep({ kind: "done", result }) : setStep({ kind: "result", code: step.code, result })
          }
        />
      )}
      {step.kind === "done" && <RedeemedCard result={step.result} onNext={next} />}

      {session.isDemo && <DemoReset token={session.token} onReset={next} onUnauthorized={onLogout} />}
    </div>
  );
}
