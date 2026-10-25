"use client";

import { Camera, CheckCircle2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { reportDispute } from "@/lib/api/resident";
import { NOTE_MAX } from "@/lib/disputes/config";
import type { DisputeReason } from "@/lib/disputes/types";
import { shrinkImage } from "@/lib/images/shrinkImage";
import { formatAgorot } from "@/lib/qr/money";

const REASONS: [DisputeReason, string][] = [
  ["BILL_HIGHER", "החשבון היה גבוה יותר"],
  ["DISCOUNT_NOT_GIVEN", "לא קיבלתי את ההנחה"],
  ["OTHER", "אחר"],
];

const day = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", year: "2-digit" });
const field = "min-h-12 w-full rounded-xl border border-navy/25 bg-white px-3 text-lg";

export interface DisputeTarget {
  redemptionId: string;
  businessName: string;
  redeemedAt: string;
  billAgorot: number;
}

interface Props {
  token: string;
  target: DisputeTarget | null;
  onClose: () => void;
  /** The report was saved (refresh the history). */
  onReported: () => void;
}

/** "הסכום לא נכון?" bottom sheet: reason, real bill, optional receipt photo and note; then a thank-you state. */
export function DisputeSheet({ token, target, onClose, onReported }: Props) {
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [claimedBill, setClaimedBill] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  /** Clears the form so the next report starts empty. */
  function close() {
    if (photo) URL.revokeObjectURL(photo.url);
    setReason(null); setClaimedBill(""); setNote(""); setPhoto(null); setErrors({}); setError(null); setSent(false);
    onClose();
  }

  /** Shrinks the picked receipt (kept readable: up to 1600px) and previews it. */
  async function onPick(file: File | undefined) {
    if (!file) return;
    try {
      const blob = await shrinkImage(file, 1600);
      if (photo) URL.revokeObjectURL(photo.url);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setErrors(({ reason, claimedBill, note }) => ({ ...(reason && { reason }), ...(claimedBill && { claimedBill }), ...(note && { note }) }));
    } catch {
      setErrors((e) => ({ ...e, photo: "לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת." }));
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  /** Sends the report. */
  async function submit() {
    if (!target) return;
    if (!reason) return setErrors({ reason: "צריך לבחור מה לא היה נכון" });
    setPending(true);
    setError(null);
    const res = await reportDispute(token, { redemptionId: target.redemptionId, reason, claimedBill, note, photo: photo?.blob ?? null });
    setPending(false);
    if ("error" in res) {
      setErrors(res.errors ?? {});
      setError(res.errors ? null : res.error);
      return;
    }
    setSent(true);
    onReported();
  }

  return (
    <Modal open={target !== null} onClose={close} title={sent ? "הדיווח נשלח" : "הסכום לא נכון?"}>
      {target && sent && (
        <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 aria-hidden className="size-14 text-emerald-600" />
          <p className="text-xl font-bold">תודה, נבדוק ונחזור אליך</p>
          <p className="text-muted">בדרך כלל תוך 3 ימי עבודה. הסטטוס יופיע בארנק, ליד המימוש.</p>
          <Button variant="navy" onClick={close}>סגירה</Button>
        </div>
      )}
      {target && !sent && (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="rounded-2xl bg-cream p-3">
            <p className="font-bold">{target.businessName}</p>
            <p className="text-sm text-muted"><bdi dir="ltr">{day.format(new Date(target.redeemedAt))}</bdi> · נרשם: <bdi dir="ltr" className="font-bold text-navy">{formatAgorot(target.billAgorot)}</bdi></p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">מה לא היה נכון?</legend>
            {REASONS.map(([value, label]) => (
              <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${reason === value ? "border-navy bg-navy/5" : "border-navy/20"}`}>
                <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => { setReason(value); setErrors({}); }} className="size-5 accent-navy" />
                {label}
              </label>
            ))}
            {errors.reason && <p role="alert" className="text-sm text-red-700">{errors.reason}</p>}
          </fieldset>

          {reason && (
            <label className="flex flex-col gap-1">
              <span className="font-bold">סכום החשבון בפועל (₪){reason === "BILL_HIGHER" ? "" : " · לא חובה"}</span>
              <input value={claimedBill} onChange={(e) => setClaimedBill(e.target.value)} inputMode="decimal" dir="ltr" className={field} aria-invalid={!!errors.claimedBill} placeholder="0.00" />
              {errors.claimedBill && <p role="alert" className="text-sm text-red-700">{errors.claimedBill}</p>}
            </label>
          )}

          {reason && (
            <div className="flex flex-col gap-2">
              <span className="font-bold">צילום הקבלה <span className="font-normal text-muted">· מומלץ מאוד, עוזר לנו לבדוק מהר</span></span>
              <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="צילום הקבלה" onChange={(e) => onPick(e.target.files?.[0])} />
              {photo ? (
                <div className="relative self-start">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the resident's own photo */}
                  <img src={photo.url} alt="הקבלה שצירפתם" className="max-h-40 rounded-xl border border-navy/15" />
                  <button type="button" aria-label="הסרת התמונה" onClick={() => { URL.revokeObjectURL(photo.url); setPhoto(null); }} className="absolute -top-3 -start-3 grid size-9 place-items-center rounded-full bg-navy text-white">
                    <X aria-hidden className="size-4" />
                  </button>
                </div>
              ) : (
                <Button size="md" variant="secondary" onClick={() => input.current?.click()} className="self-start"><Camera aria-hidden className="size-4" /> צילום או בחירה מהגלריה</Button>
              )}
              {errors.photo && <p role="alert" className="text-sm text-red-700">{errors.photo}</p>}
            </div>
          )}

          {reason && (
            <label className="flex flex-col gap-1">
              <span className="font-bold">הערה <span className="font-normal text-muted">· לא חובה</span></span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} rows={3} className="w-full rounded-xl border border-navy/25 bg-white p-3" />
              {errors.note && <p role="alert" className="text-sm text-red-700">{errors.note}</p>}
            </label>
          )}

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
          <Button type="submit" variant="navy" disabled={pending}>{pending ? "שולחים…" : "שליחת דיווח"}</Button>
        </form>
      )}
    </Modal>
  );
}
