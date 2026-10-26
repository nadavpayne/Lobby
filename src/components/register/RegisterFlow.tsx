"use client";

import { useCallback, useState } from "react";
import { isApiError } from "@/lib/api/http";
import type { RegisterApi } from "@/lib/api/register";
import { native } from "@/lib/native";
import type { ApproveResult, ScanResult } from "@/lib/qr/types";
import { ConfirmScreen } from "./ConfirmScreen";
import { ScanErrorScreen, type RegisterError } from "./ScanErrorScreen";
import { ScanScreen } from "./ScanScreen";

/** A refused approve (lost a race, month already used…) → the error screen's data. */
function approveError(r: Exclude<ApproveResult, { code: "OK" }>, apartmentNumber: string): RegisterError {
  if (r.code === "ALREADY_REDEEMED_THIS_MONTH") return { ...r, apartmentNumber };
  if (r.code === "CODE_EXPIRED") return { code: r.code, issuedAt: null, expiresAt: null };
  if (r.code === "CODE_ALREADY_USED") return { code: r.code, usedAt: null };
  return { code: r.code };
}

type Step =
  | { kind: "scan"; error: string | null }
  | { kind: "confirm"; scan: Extract<ScanResult, { code: "OK" }> }
  | { kind: "error"; error: RegisterError };

interface Props {
  api: RegisterApi;
  businessName: string;
  station: string;
  onSignOut?: () => void;
  /** The session is no longer valid (sign in again). */
  onUnauthorized: () => void;
}

/** The register: scan (camera or backup code) → confirm with the bill → success, or the matching error screen. */
export function RegisterFlow({ api, businessName, station, onSignOut, onUnauthorized }: Props) {
  const [step, setStep] = useState<Step>({ kind: "scan", error: null });
  const [busy, setBusy] = useState(false);
  const next = () => setStep({ kind: "scan", error: null });

  const onCode = useCallback(async (code: string) => {
    setBusy(true);
    const res = await api.scan(code);
    setBusy(false);
    if (isApiError(res)) {
      native.haptics.error();
      if (res.unauthorized) return onUnauthorized();
      return setStep({ kind: "scan", error: res.error });
    }
    if (res.code === "OK") native.haptics.success();
    else native.haptics.error();
    setStep(res.code === "OK" ? { kind: "confirm", scan: res } : { kind: "error", error: res as RegisterError });
  }, [api, onUnauthorized]);

  if (step.kind === "confirm") {
    return (
      <ConfirmScreen
        scan={step.scan}
        businessName={businessName}
        station={station}
        onNext={next}
        onRejected={(r) => setStep({ kind: "error", error: approveError(r, step.scan.apartmentNumber) })}
        onApprove={async (amount) => {
          const res = await api.approve(step.scan.scanId, amount);
          if (!isApiError(res)) return res;
          if (res.unauthorized) onUnauthorized();
          return res.error;
        }}
      />
    );
  }
  if (step.kind === "error") return <ScanErrorScreen error={step.error} businessName={businessName} station={station} onNext={next} />;
  return <ScanScreen businessName={businessName} station={station} busy={busy} error={step.error} onCode={onCode} onSignOut={onSignOut} />;
}
