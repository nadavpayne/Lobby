"use client";

import { useState } from "react";
import { inputClass } from "@/components/Field";
import { Button, DetailRow, Modal } from "@/components/ui";
import { saveCustomerNote } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { Customer } from "@/lib/biz/types";
import { formatShekels } from "@/lib/redemptions/money";

interface Props {
  customer: Customer | null;
  token: string;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}

const date = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });

/** Popup for one customer: their numbers, and the owner's private note and tags. */
export function NoteEditor({ customer, token, onClose, onSaved }: Props) {
  return (
    <Modal open={customer !== null} onClose={onClose} title={customer ? `${customer.firstName} · ${customer.building}` : ""}>
      {customer && <NoteForm key={customer.residentId} customer={customer} token={token} onSaved={onSaved} />}
    </Modal>
  );
}

/** The editable part (remounts per customer so the fields start from their saved note). */
function NoteForm({ customer: c, token, onSaved }: Omit<Props, "customer" | "onClose"> & { customer: Customer }) {
  const [note, setNote] = useState(c.note);
  const [tags, setTags] = useState(c.tags.join(", "));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Saves note + comma-separated tags. */
  async function save() {
    setPending(true);
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const res = await saveCustomerNote(token, c.residentId, note, tagList);
    setPending(false);
    if (isApiError(res)) return setError(res.error);
    onSaved({ ...c, note: note.trim(), tags: [...new Set(tagList)] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <DetailRow label="ביקורים">{c.visits}</DetailRow>
        <DetailRow label="סה״כ קנייה"><bdi dir="ltr">{formatShekels(c.totalSpent)}</bdi></DetailRow>
        <DetailRow label="ביקור אחרון">{date.format(new Date(c.lastVisit))}</DetailRow>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="font-medium">הערה (רק אתם רואים)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className={`${inputClass} py-2`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-medium">תגיות</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="VIP, משפחה גדולה" className={inputClass} />
        <span className="text-sm text-muted">מפרידים בפסיק</span>
      </label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <Button onClick={save} disabled={pending}>{pending ? "שומרים…" : "שמירה"}</Button>
    </div>
  );
}
