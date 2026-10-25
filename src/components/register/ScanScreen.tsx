"use client";

import { Camera, Flashlight, Keyboard, LogOut } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Modal } from "@/components/ui";
import { normalizeBackupCode } from "@/lib/qr/backupCode";
import { startCameraScan, type CameraScan } from "@/lib/native/web/cameraScan";

interface Props {
  businessName: string;
  /** "קופה 1", a cashier's name, or the owner. */
  station: string;
  busy: boolean;
  error: string | null;
  onCode: (code: string) => void;
  onSignOut?: () => void;
}

/** The orange viewfinder corners. */
function Corners() {
  const base = "pointer-events-none absolute size-[52px] border-amber";
  return (
    <>
      <span aria-hidden className={`${base} top-0 right-0 rounded-tr-[28px] border-t-4 border-r-4`} />
      <span aria-hidden className={`${base} top-0 left-0 rounded-tl-[28px] border-t-4 border-l-4`} />
      <span aria-hidden className={`${base} right-0 bottom-0 rounded-br-[28px] border-r-4 border-b-4`} />
      <span aria-hidden className={`${base} bottom-0 left-0 rounded-bl-[28px] border-b-4 border-l-4`} />
    </>
  );
}

/** Cashier scan screen: live camera in the viewfinder, "type backup code", flashlight. */
export function ScanScreen({ businessName, station, busy, error, onCode, onSignOut }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<CameraScan | null>(null);
  const [camera, setCamera] = useState<"starting" | "on" | "off">("starting");
  const [torch, setTorch] = useState<boolean | null>(null); // null = no flashlight on this device
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!video.current) return;
    startCameraScan(video.current, onCode).then(
      (s) => {
        if (cancelled) return s.stop();
        scanner.current = s;
        setCamera("on");
        setTorch(s.hasTorch ? false : null);
      },
      () => !cancelled && setCamera("off"),
    );
    return () => {
      cancelled = true;
      scanner.current?.stop();
      scanner.current = null;
    };
  }, [onCode, attempt]);

  /** Toggles the flashlight. */
  async function toggleTorch() {
    if (torch === null || !scanner.current) return;
    if (await scanner.current.setTorch(!torch)) setTorch(!torch);
  }

  /** Submits a typed XXX-XXX code. */
  function submitTyped(e: FormEvent) {
    e.preventDefault();
    const code = normalizeBackupCode(typed);
    if (!code) return setTypedError("קוד גיבוי הוא 6 תווים, למשל HAP-PY7");
    setTyping(false);
    setTyped("");
    setTypedError(null);
    onCode(code);
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-5 rounded-[28px] bg-navy-deep px-5 pt-6 pb-6 text-white md:min-h-[680px]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold">סריקת הטבה</h1>
          <p className="text-sm text-[#B7C2D9]">{businessName} · {station}</p>
        </div>
        {onSignOut && (
          <button type="button" onClick={onSignOut} aria-label="התנתקות" className="grid size-11 place-items-center rounded-xl border border-[#2A3A5E]">
            <LogOut aria-hidden className="size-5 rtl:-scale-x-100" />
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative size-[280px] overflow-hidden rounded-[28px] bg-white/5">
          <video ref={video} aria-label="מצלמת הסריקה" className={`size-full object-cover ${camera === "on" ? "" : "hidden"}`} />
          {camera === "on" && !busy && <span aria-hidden className="lobby-scanline absolute inset-x-7 h-[3px] rounded-full bg-amber" />}
          {camera === "off" && (
            <button type="button" onClick={() => { setCamera("starting"); setAttempt((n) => n + 1); }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-[#B7C2D9]">
              <Camera aria-hidden className="size-8" />
              אין גישה למצלמה. אפשרו מצלמה בדפדפן ולחצו כאן, או הקלידו קוד גיבוי.
            </button>
          )}
          {busy && <span className="absolute inset-0 grid place-items-center bg-navy-deep/70 font-bold">בודקים…</span>}
          <Corners />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[17px] font-semibold">כוונו את המצלמה לקוד בטלפון של הדייר</p>
          <p className="max-w-[290px] text-sm leading-5 text-[#B7C2D9]">הבדיקה אוטומטית: שהקוד בתוקף, ושהדירה עוד לא מימשה הטבה אצלכם החודש</p>
          {error && <p role="alert" className="mt-2 rounded-xl bg-red-500/20 px-3 py-2 text-sm">{error}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setTyping(true)} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-white font-bold text-navy">
          <Keyboard aria-hidden className="size-5" /> הקלדת קוד גיבוי
        </button>
        <button
          type="button"
          onClick={toggleTorch}
          disabled={torch === null}
          aria-label={torch ? "כיבוי פנס" : "הפעלת פנס"}
          aria-pressed={torch === true}
          title={torch === null ? "אין פנס במכשיר הזה" : undefined}
          className={`grid size-[52px] place-items-center rounded-xl border border-[#2A3A5E] disabled:opacity-40 ${torch ? "bg-amber text-navy" : ""}`}
        >
          <Flashlight aria-hidden className="size-5" />
        </button>
      </div>

      <Modal open={typing} onClose={() => setTyping(false)} title="קוד גיבוי">
        <form onSubmit={submitTyped} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">6 התווים שמתחת ל-QR בטלפון של הדייר</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase().slice(0, 7))}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
              placeholder="XXX-XXX"
              aria-invalid={!!typedError}
              className="min-h-14 rounded-xl border-2 border-navy px-3 text-center text-3xl font-extrabold tracking-[4px] text-navy outline-none placeholder:text-navy/20 focus:ring-2 focus:ring-amber"
            />
          </label>
          {typedError && <p role="alert" className="text-sm text-red-700">{typedError}</p>}
          <Button type="submit" variant="navy">בדיקת הקוד</Button>
        </form>
      </Modal>
    </div>
  );
}
