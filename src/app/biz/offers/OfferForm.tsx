"use client";

import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { BenefitCard } from "@/components/resident/BenefitCard";
import { Button, Card } from "@/components/ui";
import { saveOffer } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BizOffer, OfferInput } from "@/lib/biz/types";
import { validateOffer, type OfferErrors } from "@/lib/biz/validateOffer";
import { CATEGORIES, CATEGORY_ICONS, type Category } from "@/lib/businesses/categories";
import type { ResidentOffer } from "@/lib/offers/types";

type Form = Record<keyof OfferInput, string>;

interface Props {
  token: string;
  businessName: string;
  /** The business's logo, shown on the preview card like residents will see it. */
  logoUrl: string | null;
  /** null = new offer. */
  offer: BizOffer | null;
  defaultCategory: string;
  onSaved: (offer: BizOffer) => void;
  onCancel: () => void;
}

/** Form values for an existing offer, or an empty new one (the rate is whatever was agreed with Lobby). */
function initial(offer: BizOffer | null, category: string): Form {
  return {
    title: offer?.title ?? "הנחה על כל ",
    description: offer?.description ?? "",
    terms: offer?.terms ?? "",
    discountPercent: offer ? String(offer.discountPercent) : "",
    category: offer?.category ?? category,
    startsOn: offer?.startsOn ?? "",
    endsOn: offer?.endsOn ?? "",
  };
}

/** The form as the resident app will show it (for the live preview). */
function previewOf(f: Form, businessName: string, logoUrl: string | null, benefit: Pick<ResidentOffer, "benefitType" | "oneTimeScope">): ResidentOffer {
  const today = new Date().toISOString().slice(0, 10);
  return {
    businessId: "preview", businessName, category: f.category, subcategories: [], tags: [], address: "", businessDescription: null, logoUrl,
    coverUrl: null, lat: null, lng: null, hours: null, branches: [],
    title: f.title || "כותרת ההטבה", discountPercent: Number(f.discountPercent) || 0, ...benefit, description: f.description, terms: f.terms || null,
    startsAt: f.startsOn ? `${f.startsOn}T00:00:00Z` : null, endsAt: f.endsOn ? `${f.endsOn}T12:00:00Z` : null,
    joinedAt: new Date().toISOString(), distanceMeters: null, withinRadius: false, featured: false, recentRedemptions: 0, remaining: null,
    state: f.startsOn && f.startsOn > today ? "upcoming" : "available",
  };
}

/** Create/edit an offer with a live preview of the resident card. Saving sends it to Lobby for approval. */
export function OfferForm({ token, businessName, logoUrl, offer, defaultCategory, onSaved, onCancel }: Props) {
  const [f, setF] = useState<Form>(() => initial(offer, defaultCategory));
  const [errors, setErrors] = useState<OfferErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof Form) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [key]: e.target.value }));

  /** Validates locally, then saves. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateOffer(f);
    if (!v.ok) return setErrors(v.errors);
    setErrors({});
    setPending(true);
    const res = await saveOffer(token, { ...v.data, ...(offer && { id: offer.id }) });
    setPending(false);
    if (isApiError(res)) {
      setError(res.error);
      if ("errors" in res) setErrors(res.errors as OfferErrors);
      return;
    }
    if ("errors" in res) return setErrors(res.errors);
    onSaved(res);
  }

  const categories = Object.entries(CATEGORIES).map(([slug, name]) => ({ slug, name, icon: CATEGORY_ICONS[slug as Category] }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card as="div">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <h2 className="text-xl font-bold">{offer ? "עריכת הטבה" : "הטבה חדשה"}</h2>
          <Field label="כותרת" error={errors.title} hint="מה הדייר מקבל, בקצרה"><input value={f.title} onChange={set("title")} maxLength={60} className={inputClass} aria-invalid={!!errors.title} /></Field>
          <Field label="תיאור" error={errors.description}><textarea value={f.description} onChange={set("description")} maxLength={300} rows={2} className={`${inputClass} py-2`} aria-invalid={!!errors.description} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="אחוז הנחה" error={errors.discountPercent}>
              <input value={f.discountPercent} onChange={set("discountPercent")} inputMode="numeric" dir="ltr" className={inputClass} aria-invalid={!!errors.discountPercent} />
            </Field>
            <Field label="קטגוריה" error={errors.category}>
              <select value={f.category} onChange={set("category")} className={inputClass}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="תנאים (לא חובה)" error={errors.terms} hint="למשל: לא כולל משלוחים"><input value={f.terms} onChange={set("terms")} maxLength={300} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="מתחילה ב-" error={errors.startsOn} hint="ריק = מיד אחרי אישור"><input type="date" value={f.startsOn} onChange={set("startsOn")} className={inputClass} /></Field>
            <Field label="מסתיימת ב-" error={errors.endsOn} hint="ריק = הנחה קבועה"><input type="date" value={f.endsOn} onChange={set("endsOn")} className={inputClass} /></Field>
          </div>
          <p className="rounded-2xl bg-sky p-3 text-sm">אחרי שמירה צוות לובי בודק את ההטבה, ורק אז היא מופיעה לדיירים. השהיה והפעלה לא דורשות אישור.</p>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Button type="submit" size="md" disabled={pending}>{pending ? "שומרים…" : "שמירה ושליחה לאישור"}</Button>
            <Button size="md" variant="secondary" onClick={onCancel} disabled={pending}>ביטול</Button>
          </div>
        </form>
      </Card>
      <aside className="flex flex-col gap-2">
        <h3 className="font-bold">כך הדיירים יראו את זה</h3>
        <div className="pointer-events-none" aria-hidden>
          <BenefitCard offer={previewOf(f, businessName, logoUrl, { benefitType: offer?.benefitType ?? "monthly", oneTimeScope: offer?.oneTimeScope ?? "apartment" })} categories={categories} layout="grid" />
        </div>
      </aside>
    </div>
  );
}
