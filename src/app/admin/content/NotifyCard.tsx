"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { Button, Card, Tag } from "@/components/ui";
import { sendAnnouncement } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { ContentData, SentNotification } from "@/lib/admin/content";
import { validateNotification, type NotificationInput } from "@/lib/admin/validate";

const when = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

/** Who an announcement went to, in words. */
const audience = (n: SentNotification) => (n.target === "all" ? "כולם" : n.target === "city" ? n.city : n.buildingName);

interface Props {
  token: string;
  sent: SentNotification[];
  cities: string[];
  buildings: { id: string; name: string }[];
  onChanged: (c: ContentData) => void;
}

/** Send an announcement to everyone, a city or a building; shows what was sent. */
export function NotifyCard({ token, sent, cities, buildings, onChanged }: Props) {
  const [f, setF] = useState({ title: "", body: "", target: "all" as NotificationInput["target"], city: cities[0] ?? "", buildingId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF((v) => ({ ...v, [k]: e.target.value })); setDone(false); };

  /** Validates, confirms and sends. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateNotification(f);
    if (!v.ok) return setErrors(v.errors as Record<string, string>);
    if (!confirm("לשלוח את ההודעה? היא תופיע מיד לדיירים.")) return;
    const res = await sendAnnouncement(token, v.data);
    if (isApiError(res)) return setErrors(res.errors ?? { title: res.error });
    setErrors({});
    setF((x) => ({ ...x, title: "", body: "" }));
    setDone(true);
    onChanged(res);
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">הודעות לדיירים</h2>
      <p className="-mt-3 text-sm text-navy/60">ההודעה מופיעה בלשונית „הבניין” באפליקציה. התראות פוש יתווספו עם האפליקציה בחנויות.</p>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <Field label="כותרת" error={errors.title}><input value={f.title} onChange={set("title")} maxLength={60} className={inputClass} /></Field>
        <Field label="הודעה" error={errors.body}><textarea value={f.body} onChange={set("body")} maxLength={300} rows={3} className={`${inputClass} py-2`} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="למי" error={errors.target}>
            <select value={f.target} onChange={set("target")} className={inputClass}><option value="all">כל הדיירים</option><option value="city">עיר</option><option value="building">בניין</option></select>
          </Field>
          {f.target === "city" && (
            <Field label="עיר" error={errors.city}><select value={f.city} onChange={set("city")} className={inputClass}>{cities.map((c) => <option key={c}>{c}</option>)}</select></Field>
          )}
          {f.target === "building" && (
            <Field label="בניין" error={errors.buildingId}>
              <select value={f.buildingId} onChange={set("buildingId")} className={inputClass}><option value="">בחרו בניין</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            </Field>
          )}
        </div>
        <Button type="submit" size="md" className="self-start"><Send aria-hidden className="size-4 rtl:-scale-x-100" /> שליחה</Button>
        {done && <p role="status" className="text-emerald-800">ההודעה נשלחה.</p>}
      </form>
      {sent.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-navy/10 pt-3">
          {sent.map((n) => (
            <li key={n.id} className="rounded-2xl bg-cream p-3">
              <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{n.title}</span><Tag tint="sky">{audience(n)}</Tag><span className="text-sm text-navy/60">{when.format(new Date(n.createdAt))}</span></div>
              <p className="text-sm">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
