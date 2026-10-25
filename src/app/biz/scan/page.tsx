"use client";

import { useMemo, useState } from "react";
import { CodeEntry } from "@/components/redeem/CodeEntry";
import { RedeemedCard } from "@/components/redeem/RedeemedCard";
import { ResultCard } from "@/components/redeem/ResultCard";
import { ownerRedeemApi } from "@/lib/api/redeemApi";
import type { RedeemResult, VerifyResult } from "@/lib/redemptions/types";
import { useBiz } from "../BizShell";

type Step =
  | { kind: "code" }
  | { kind: "result"; code: string; result: VerifyResult }
  | { kind: "done"; result: Extract<RedeemResult, { status: "redeemed" }> };

/** Register screen for the owner: type or scan the code → bill amount → confirmation → next. Same flow as the staff terminal. */
export default function ScanScreen() {
  const { token, signOut } = useBiz();
  const api = useMemo(() => ownerRedeemApi(token), [token]);
  const [step, setStep] = useState<Step>({ kind: "code" });
  const next = () => setStep({ kind: "code" });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold">מימוש הטבה</h1>
      {step.kind === "code" && <CodeEntry api={api} onUnauthorized={signOut} onResult={(code, result) => setStep({ kind: "result", code, result })} />}
      {step.kind === "result" && (
        <ResultCard
          api={api}
          code={step.code}
          result={step.result}
          onUnauthorized={signOut}
          onBack={next}
          onRedeemed={(result) => (result.status === "redeemed" ? setStep({ kind: "done", result }) : setStep({ kind: "result", code: step.code, result }))}
        />
      )}
      {step.kind === "done" && <RedeemedCard result={step.result} onNext={next} />}
    </div>
  );
}
