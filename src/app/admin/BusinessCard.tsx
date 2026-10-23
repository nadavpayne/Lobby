"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { AdminBusiness, StatusChange } from "@/lib/admin/types";
import { CATEGORIES, type Category } from "@/lib/businesses/categories";
import type { BusinessStatus } from "@/lib/businesses/types";
import { native } from "@/lib/native";

const STATUS_BADGE: Record<BusinessStatus, [label: string, className: string]> = {
  pending: ["ממתין לאישור", "bg-amber/25"],
  active: ["פעיל", "bg-emerald-100 text-emerald-900"],
  paused: ["מושהה", "bg-navy/10"],
};

const date = new Intl.DateTimeFormat("he-IL", { dateStyle: "short" });

interface Props {
  business: AdminBusiness;
  onSetStatus: (id: string, status: StatusChange) => Promise<string | null>;
}

/** One business: details, offer, status, activate/pause and "send link to business". */
export function BusinessCard({ business: b, onSetStatus }: Props) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [label, badgeClass] = STATUS_BADGE[b.status];
  const next: StatusChange = b.status === "active" ? "paused" : "active";

  async function toggle() {
    setPending(true);
    setMessage(await onSetStatus(b.id, next));
    setPending(false);
  }

  /** Shares the business's personal verification link (e.g. on WhatsApp). */
  async function shareLink() {
    const result = await native.share.share({ title: "לובי — אימות קודים", text: `הקישור של ${b.name} לאימות קודי לובי:`, url: b.verifyUrl });
    if (result === "copied") setMessage("הקישור הועתק");
  }

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="me-auto text-xl font-bold">{b.name}</h2>
        {b.isDemo && <span className="rounded-full bg-navy px-3 py-1 text-sm text-cream">הדגמה</span>}
        <span className={`rounded-full px-3 py-1 text-sm ${badgeClass}`}>{label}</span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-navy/70">קטגוריה</dt>
        <dd>{CATEGORIES[b.category as Category] ?? b.category}</dd>
        <dt className="text-navy/70">כתובת</dt>
        <dd>{b.address}</dd>
        <dt className="text-navy/70">איש קשר</dt>
        <dd>
          {b.contactName} · <a href={`tel:${b.phone}`} dir="ltr" className="underline">{b.phone}</a>
        </dd>
        <dt className="text-navy/70">אימייל</dt>
        <dd className="break-all">
          <a href={`mailto:${b.email}`} dir="ltr" className="underline">{b.email}</a>
        </dd>
        <dt className="text-navy/70">הטבה</dt>
        <dd>{b.offer ? <><bdi dir="ltr">{b.offer.discountPercent}%</bdi> · {b.offer.description}</> : "—"}</dd>
        <dt className="text-navy/70">נרשם</dt>
        <dd><bdi dir="ltr">{date.format(new Date(b.createdAt))}</bdi></dd>
      </dl>

      {message && <p role="status" className="text-sm">{message}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={toggle} disabled={pending} className={next === "active" ? primaryButton : secondaryButton}>
          {pending ? "מעדכנים…" : next === "active" ? "הפעלה" : "השהיה"}
        </button>
        <button type="button" onClick={shareLink} className={secondaryButton}>שליחת הקישור לעסק</button>
      </div>
    </article>
  );
}
