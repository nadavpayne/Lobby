"use client";

import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/Field";
import { Button, DetailRow, Modal } from "@/components/ui";
import { voidBizRedemption } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BizRedemption } from "@/lib/biz/redemptionsLog";
import { formatAgorot } from "@/lib/qr/money";

/** Owner-only void: shows the redemption, asks for a reason, keeps the row but drops it from totals and frees the month. */
export function VoidDialog({ token, redemption: r, onClose, onVoided }: { token: string; redemption: BizRedemption | null; onClose: () => void; onVoided: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Sends the void. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!r) return;
    setPending(true);
    const res = await voidBizRedemption(token, r.id, reason);
    setPending(false);
    if (isApiError(res)) return setError(res.error);
    setReason("");
    setError(null);
    onVoided();
  }

  return (
    <Modal open={r !== null} onClose={onClose} title="ביטול מימוש">
      {r && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <DetailRow label="דירה">{r.apartment} · {r.building}</DetailRow>
            <DetailRow label="חשבון"><bdi dir="ltr">{formatAgorot(r.billAgorot)}</bdi></DetailRow>
            <DetailRow label="הנחה"><bdi dir="ltr">{formatAgorot(r.discountAgorot)}</bdi></DetailRow>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-medium">סיבת הביטול</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={2} required placeholder="למשל: הלקוח ביטל את הקנייה" className={`${inputClass} py-2`} />
          </label>
          <p className="text-sm text-muted">המימוש יישאר ביומן כ„בוטל”, לא ייספר בסיכומים ובעמלה, והדירה תוכל לממש שוב החודש.</p>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <Button type="submit" variant="danger" disabled={pending || reason.trim().length < 2}>{pending ? "מבטלים…" : "ביטול המימוש"}</Button>
        </form>
      )}
    </Modal>
  );
}
