"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { Button, Card, Tag } from "@/components/ui";
import { removeBanner, saveBanner } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { Banner, ContentData } from "@/lib/admin/content";
import { validateBanner } from "@/lib/admin/validate";

type Form = { title: string; subtitle: string; imageUrl: string; businessId: string; city: string; active: boolean; sort: string };
const EMPTY: Form = { title: "", subtitle: "", imageUrl: "", businessId: "", city: "", active: true, sort: "0" };

interface Props {
  token: string;
  banners: Banner[];
  businesses: { id: string; name: string }[];
  onChanged: (c: ContentData) => void;
}

/** Hero banners on the resident home screen: list + add/edit form. With no active banner, the hottest offers show. */
export function BannersCard({ token, banners, businesses, onChanged }: Props) {
  const [f, setF] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));

  /** Loads a banner into the form. */
  const edit = (b: Banner) => {
    setEditId(b.id);
    setF({ title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl ?? "", businessId: b.businessId ?? "", city: b.city ?? "", active: b.active, sort: String(b.sort) });
  };

  /** Validates and saves the banner. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateBanner(f);
    if (!v.ok) return setErrors(v.errors as Record<string, string>);
    const res = await saveBanner(token, { ...v.data, ...(editId && { id: editId }) });
    if (isApiError(res)) return setErrors(res.errors ?? { title: res.error });
    setErrors({});
    setF(EMPTY);
    setEditId(null);
    onChanged(res);
  }

  /** Deletes a banner after confirming. */
  async function remove(b: Banner) {
    if (!confirm(`למחוק את הבאנר „${b.title}”?`)) return;
    const res = await removeBanner(token, b.id);
    if (!isApiError(res)) onChanged(res);
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">באנרים בדף הבית</h2>
      <p className="-mt-3 text-sm text-navy/60">בלי באנר פעיל, הדיירים רואים את ההטבות החמות ביותר.</p>
      <ul className="flex flex-col gap-2">
        {banners.map((b) => (
          <li key={b.id} className="flex items-center gap-2 rounded-2xl bg-cream p-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{b.title}</span>
              <span className="block truncate text-sm text-navy/60">{b.subtitle ?? ""}{b.city ? ` · ${b.city}` : " · כל הערים"}</span>
            </span>
            {!b.active && <Tag tint="white">כבוי</Tag>}
            <button type="button" aria-label="עריכה" onClick={() => edit(b)} className="grid size-9 place-items-center rounded-lg hover:bg-navy/5"><Pencil aria-hidden className="size-4" /></button>
            <button type="button" aria-label="מחיקה" onClick={() => remove(b)} className="grid size-9 place-items-center rounded-lg hover:bg-navy/5"><Trash2 aria-hidden className="size-4" /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex flex-col gap-3 border-t border-navy/10 pt-3" noValidate>
        <h3 className="font-bold">{editId ? "עריכת באנר" : "באנר חדש"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="כותרת" error={errors.title}><input value={f.title} onChange={set("title")} maxLength={60} className={inputClass} /></Field>
          <Field label="שורת משנה" error={errors.subtitle}><input value={f.subtitle} onChange={set("subtitle")} maxLength={120} className={inputClass} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="לחיצה פותחת עסק">
            <select value={f.businessId} onChange={set("businessId")} className={inputClass}><option value="">בלי קישור</option>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          </Field>
          <Field label="עיר (ריק = כולן)"><input value={f.city} onChange={set("city")} className={inputClass} /></Field>
          <Field label="סדר" error={errors.sort}><input value={f.sort} onChange={set("sort")} inputMode="numeric" dir="ltr" className={inputClass} /></Field>
        </div>
        <Field label="קישור לתמונה (לא חובה)" error={errors.imageUrl}><input value={f.imageUrl} onChange={set("imageUrl")} dir="ltr" placeholder="https://" className={inputClass} /></Field>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => setF((v) => ({ ...v, active: e.target.checked }))} className="size-5 accent-navy" /> פעיל</label>
        <div className="flex gap-2">
          <Button type="submit" size="md">{editId ? "שמירה" : "הוספה"}</Button>
          {editId && <Button size="md" variant="ghost" onClick={() => { setEditId(null); setF(EMPTY); }}>ביטול</Button>}
        </div>
      </form>
    </Card>
  );
}
