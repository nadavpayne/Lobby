"use client";

import { useState } from "react";
import { Button, Card, CategoryIcon } from "@/components/ui";
import { saveCategory } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminCategory, ContentData } from "@/lib/admin/content";

/** One editable category row: name, order, shown/hidden. */
function CategoryRow({ token, c, onChanged }: { token: string; c: AdminCategory; onChanged: (d: ContentData) => void }) {
  const [name, setName] = useState(c.name);
  const [sort, setSort] = useState(String(c.sort));
  const [active, setActive] = useState(c.active);
  const [error, setError] = useState<string | null>(null);
  const dirty = name !== c.name || Number(sort) !== c.sort || active !== c.active;

  /** Saves this row. */
  async function save() {
    const res = await saveCategory(token, c.slug, name.trim(), Number(sort), active);
    if (isApiError(res)) return setError(res.error);
    setError(null);
    onChanged(res);
  }

  return (
    <li className="flex flex-wrap items-center gap-2">
      <CategoryIcon name={c.icon} className="size-5 text-navy/70" />
      <input aria-label={`שם הקטגוריה ${c.slug}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} className="min-h-10 w-32 rounded-lg border border-navy/25 px-2" />
      <input aria-label="סדר" value={sort} onChange={(e) => setSort(e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" className="min-h-10 w-16 rounded-lg border border-navy/25 px-2 text-center" />
      <label className="inline-flex items-center gap-1 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-navy" /> מוצגת</label>
      {dirty && <Button size="sm" variant="navy" onClick={save}>שמירה</Button>}
      {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
    </li>
  );
}

/** Category chips of the resident app: rename, reorder, hide. */
export function CategoriesCard({ token, categories, onChanged }: { token: string; categories: AdminCategory[]; onChanged: (d: ContentData) => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">קטגוריות</h2>
      <p className="-mt-2 text-sm text-navy/60">השם והסדר של הצ׳יפים באפליקציית הדיירים. קטגוריה מוסתרת לא מופיעה כצ׳יפ.</p>
      <ul className="flex flex-col gap-2">{categories.map((c) => <CategoryRow key={`${c.slug}-${c.name}-${c.sort}-${c.active}`} token={token} c={c} onChanged={onChanged} />)}</ul>
    </Card>
  );
}
