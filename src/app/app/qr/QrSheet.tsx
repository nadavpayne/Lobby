"use client";

import { ChevronRight, Info } from "lucide-react";
import { useEffect } from "react";
import { QrCode } from "@/components/QrCode";
import { Button, Skeleton } from "@/components/ui";
import { monthOfPeriod } from "@/lib/qr/labels";
import { useResidentToken } from "@/lib/qr/useResidentToken";
import { formatCountdown } from "@/lib/time/countdown";
import { DoneView } from "./DoneView";

const VALID_SECONDS = 300;

interface Props {
  authToken: string;
  businessId: string;
  businessName: string;
  discountPercent: number;
  /** "רוטשילד 45, פתח תקווה" for the footer. */
  address: string;
  onClose: () => void;
  /** The register approved it: refresh the feed and wallet. */
  onRedeemed: () => void;
}

/** Full-screen "show at the register" sheet: business, QR with a 5:00 countdown + progress bar, backup code; then Done. */
export function QrSheet({ authToken, businessId, businessName, discountPercent, address, onClose, onRedeemed }: Props) {
  const { state, renew } = useResidentToken(authToken, businessId, onRedeemed);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`מימוש הטבה ב${businessName}`} className="fixed inset-0 z-30 overflow-y-auto bg-cream text-navy">
      <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {state.phase === "done" ? (
          <DoneView authToken={authToken} done={state.done} onClose={onClose} />
        ) : (
          <>
            <header className="flex items-center justify-between gap-3">
              <button type="button" onClick={onClose} aria-label="חזרה" className="grid size-11 place-items-center rounded-xl border border-hairline bg-white">
                <ChevronRight aria-hidden className="size-5" />
              </button>
              <h1 className="text-lg font-bold">מימוש הטבה</h1>
              <span dir="ltr" className="text-xl font-black tracking-tight">Lobby</span>
            </header>

            <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5">
              <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-navy text-xl font-extrabold text-white">{businessName.trim().charAt(0)}</span>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold">{businessName}</p>
                <p className="text-sm text-muted">הטבה לחברי Lobby</p>
              </div>
              <span className="ms-auto shrink-0 rounded-full bg-highlight px-3 py-1.5 text-sm font-extrabold"><bdi dir="ltr">{discountPercent}%</bdi> הנחה</span>
            </div>

            <section className="flex flex-col items-center gap-4 rounded-[28px] bg-white p-6 shadow-lift">
              <div className="text-center">
                <h2 className="text-[22px] leading-7 font-extrabold">הציגו את הקוד בקופה</h2>
                <p className="text-sm text-muted">הקופאי סורק, וההנחה נכנסת מיד</p>
              </div>

              {state.phase === "showing" && (
                <>
                  <div className="rounded-2xl border-2 border-navy bg-white p-3">
                    <QrCode value={state.token.qr} size={200} />
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">הקוד בתוקף עוד</span>
                      <span role="timer" dir="ltr" className="font-bold tabular-nums">{formatCountdown(state.secondsLeft)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cream">
                      <div className="h-1.5 rounded-full bg-amber transition-[width] duration-1000 ease-linear" style={{ width: `${(state.secondsLeft / VALID_SECONDS) * 100}%` }} />
                    </div>
                  </div>
                  <div className="h-px w-full bg-hairline" />
                  <div className="text-center">
                    <p className="text-xs text-muted">לא נסרק? קוד גיבוי</p>
                    <p dir="ltr" className="text-[26px] font-extrabold tracking-[4px] tabular-nums">{state.token.backupCode}</p>
                  </div>
                </>
              )}
              {state.phase === "loading" && <Skeleton className="size-[228px] rounded-2xl" />}
              {state.phase === "replaced" && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <p>הקוד הוחלף כי פתחתם את ההטבה בטלפון אחר בדירה.</p>
                  <Button size="md" onClick={renew}>קוד חדש בטלפון הזה</Button>
                </div>
              )}
              {state.phase === "error" && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <p role="alert" className="text-red-700">{state.error}</p>
                  <Button size="md" variant="secondary" onClick={onClose}>חזרה</Button>
                </div>
              )}
            </section>

            <div className="flex items-start gap-2.5 rounded-2xl bg-warm p-3.5 text-sm leading-5">
              <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
              <p>
                הטבה אחת בחודש לדירה בכל עסק.
                {state.phase === "showing" && ` זו ההטבה שלכם ב${businessName} ל${monthOfPeriod(state.token.period)}.`}
              </p>
            </div>

            <p className="mt-auto text-center text-xs text-muted">
              {state.phase === "showing" && `דירה ${state.token.apartmentNumber} · `}{address}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
