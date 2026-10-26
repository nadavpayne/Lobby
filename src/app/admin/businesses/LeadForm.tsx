"use client";

import { useState, type FormEvent } from "react";
import { AddressInput, addressLookupOn } from "@/components/address/AddressInput";
import { Field, inputClass } from "@/components/Field";
import { Button, Modal } from "@/components/ui";
import { addBusinessLead } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminBusiness } from "@/lib/admin/types";
import { validateBusinessLead, type BusinessLead } from "@/lib/admin/validate";
import { CATEGORIES } from "@/lib/businesses/categories";

type Form = Record<keyof BusinessLead, string>;
const EMPTY: Form = { name: "", category: "restaurants", address: "", city: "פתח תקווה", contactName: "", phone: "", email: "", placeId: "" };

/** Popup to add a business by hand as a sales lead. */
export function LeadForm({ token, open, onClose, onAdded }: { token: string; open: boolean; onClose: () => void; onAdded: (b: AdminBusiness) => void }) {
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [pending, setPending] = useState(false);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));

  /** Validates and creates the lead. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateBusinessLead(f);
    if (!v.ok) return setErrors(v.errors as Partial<Form>);
    setPending(true);
    const res = await addBusinessLead(token, v.data);
    setPending(false);
    if (isApiError(res)) return setErrors((res.errors ?? { name: res.error }) as Partial<Form>);
    setF(EMPTY);
    setErrors({});
    onAdded(res);
  }

  return (
    <Modal open={open} onClose={onClose} title="עסק חדש (ליד)">
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="שם העסק" error={errors.name}><input value={f.name} onChange={set("name")} className={inputClass} /></Field>
          <Field label="קטגוריה" error={errors.category}>
            <select value={f.category} onChange={set("category")} className={inputClass}>{Object.entries(CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
        </div>
        {addressLookupOn ? (
          <AddressInput
            key={open ? "open" : "closed"}
            error={errors.address ?? errors.city}
            onChange={(a) => setF((v) => ({ ...v, placeId: a?.placeId ?? "", address: a?.address ?? "", city: a?.city ?? "" }))}
          />
        ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="כתובת" error={errors.address}><input value={f.address} onChange={set("address")} className={inputClass} /></Field>
          <Field label="עיר" error={errors.city}><input value={f.city} onChange={set("city")} className={inputClass} /></Field>
        </div>
        )}
        <Field label="איש קשר" error={errors.contactName}><input value={f.contactName} onChange={set("contactName")} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="טלפון" error={errors.phone}><input value={f.phone} onChange={set("phone")} inputMode="tel" dir="ltr" className={inputClass} /></Field>
          <Field label="אימייל" error={errors.email} hint="איתו בעל העסק ייכנס ל-/biz"><input value={f.email} onChange={set("email")} inputMode="email" dir="ltr" className={inputClass} /></Field>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "מוסיפים…" : "הוספה לצנרת"}</Button>
      </form>
    </Modal>
  );
}
