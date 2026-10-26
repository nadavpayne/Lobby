"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Skeleton, Tag } from "@/components/ui";
import { disputeAction, fetchDispute } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminDisputeDetail } from "@/lib/disputes/types";
import { formatAgorot, parseBillAgorot, splitBill } from "@/lib/qr/money";
import { currentPeriod } from "@/lib/period";
import { ageLabel, REASON_LABEL, STATUS_LABEL } from "./labels";

const when = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });
const money = (a: number) => <bdi dir="ltr">{formatAgorot(a)}</bdi>;
const field = "min-h-11 w-full rounded-xl border border-navy/25 bg-white px-3";

interface Props {
  token: string;
  id: string | null;
  onClose: () => void;
  /** A status changed: refresh the queue. */
  onChanged: () => void;
}

/** One report: photo, note, the redemption, the business's other reports; mark in review, correct the bill, or dismiss. */
export function DisputeDetail({ token, id, onClose, onChanged }: Props) {
  const [d, setD] = useState<AdminDisputeDetail>();
  const [bill, setBill] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    if (!id) return;
    let live = true;
    fetchDispute(token, id).then((res) => {
      if (!live) return;
      if (isApiError(res)) return setError(res.error);
      setD(res);
      setBill(res.claimedBillAgorot ? String(res.claimedBillAgorot / 100) : "");
    });
    return () => {
      live = false;
    };
  }, [token, id, reloads]);

  /** Closes and clears the panel. */
  function close() {
    setD(undefined); setNote(""); setError(null);
    onClose();
  }

  /** Runs an action, then reloads this report and the queue. */
  async function act(action: Parameters<typeof disputeAction>[2]) {
    if (!d) return;
    setPending(true);
    const res = await disputeAction(token, d.id, action);
    setPending(false);
    if ("error" in res) return setError(Object.values(res.errors ?? {})[0] ?? res.error);
    setError(null);
    setNote("");
    setReloads((n) => n + 1);
    onChanged();
  }

  const shown = d?.id === id ? d : undefined;
  const open = shown && (shown.status === "OPEN" || shown.status === "IN_REVIEW");
  const newBill = parseBillAgorot(bill);
  const preview = shown && newBill !== null ? splitBill(newBill, shown.redemption.discountRate, shown.redemption.commissionRate, shown.redemption.commissionBase) : null;
  const charged = shown ? shown.redemption.period < currentPeriod() : false;

  return (
    <Modal open={id !== null} onClose={close} title="דיווח על סכום">
      {!shown && !error && <Skeleton className="h-64 w-full rounded-2xl" />}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
      {shown && (
        <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tint={STATUS_LABEL[shown.status][1]}>{STATUS_LABEL[shown.status][0]}</Tag>
            <span className="font-bold">{shown.businessName}</span>
            <span className="text-sm text-muted">· דווח {ageLabel(shown.createdAt)}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-3 text-sm">
            <dt className="text-muted">סיבה</dt><dd>{REASON_LABEL[shown.reason]}</dd>
            <dt className="text-muted">מימוש</dt><dd><bdi dir="ltr">{when.format(new Date(shown.redeemedAt))}</bdi> · {shown.building}, דירה {shown.apartment}</dd>
            <dt className="text-muted">נרשם בקופה</dt><dd>{money(shown.original.billAgorot)} (הנחה {money(shown.original.discountAgorot)}, עמלה {money(shown.original.commissionAgorot)})</dd>
            <dt className="text-muted">לפי הדייר</dt><dd className="font-bold">{shown.claimedBillAgorot === null ? "—" : money(shown.claimedBillAgorot)}</dd>
            {shown.redemption.status === "voided" && <><dt className="text-muted">שימו לב</dt><dd className="text-red-700">המימוש בוטל על ידי העסק</dd></>}
          </dl>
          {shown.note && <blockquote className="rounded-2xl border-s-4 border-amber bg-white p-3">{shown.note}</blockquote>}
          {shown.photoUrl && (
            <a href={shown.photoUrl} target="_blank" rel="noreferrer" className="self-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed private link, expires in minutes */}
              <img src={shown.photoUrl} alt="צילום הקבלה שהדייר צירף" className="max-h-64 rounded-xl border border-navy/15" />
            </a>
          )}
          {shown.resolutionNote && <p className="rounded-2xl bg-cream p-3 text-sm">הערת טיפול: {shown.resolutionNote}</p>}

          {open && (
            <div className="flex flex-col gap-3 border-t border-navy/10 pt-3">
              {shown.status === "OPEN" && <Button size="md" variant="secondary" disabled={pending} onClick={() => act({ action: "review" })} className="self-start">העברה לבדיקה</Button>}
              <label className="flex flex-col gap-1 text-sm font-bold">סכום החשבון המתוקן (₪)
                <input value={bill} onChange={(e) => setBill(e.target.value)} inputMode="decimal" dir="ltr" className={field} />
              </label>
              {preview && (
                <p className="text-sm text-navy/70">
                  אחרי התיקון: הנחה {money(preview.discountAgorot)}, שולם {money(preview.paidAgorot)}, עמלה {money(preview.commissionAgorot)}
                  {" "}(שינוי בעמלה: {money(preview.commissionAgorot - shown.original.commissionAgorot)}{charged ? ", ייכנס לחיוב של החודש הנוכחי" : ""})
                </p>
              )}
              <label className="flex flex-col gap-1 text-sm font-bold">הערה לדייר <span className="font-normal text-muted">חובה בדחייה, הדייר יראה אותה</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={field} />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button size="md" variant="navy" disabled={pending || newBill === null || shown.redemption.status === "voided"} onClick={() => act({ action: "correct", bill, note })}>תיקון הסכום</Button>
                <Button size="md" variant="danger" disabled={pending || note.trim().length < 2} onClick={() => act({ action: "dismiss", note })}>דחיית הדיווח</Button>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-1 border-t border-navy/10 pt-3 text-sm">
            <h3 className="font-bold">דיווחים קודמים על העסק ({shown.history.length})</h3>
            {shown.history.length === 0 && <p className="text-muted">אין.</p>}
            {shown.history.slice(0, 10).map((h) => (
              <p key={h.id} className="flex items-center gap-2"><Tag tint={STATUS_LABEL[h.status][1]}>{STATUS_LABEL[h.status][0]}</Tag>{REASON_LABEL[h.reason]} · {ageLabel(h.createdAt)}</p>
            ))}
          </section>
        </div>
      )}
    </Modal>
  );
}
