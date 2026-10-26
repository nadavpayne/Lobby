"use client";

import { useState, type FormEvent } from "react";
import { AddressInput, addressLookupOn } from "@/components/address/AddressInput";
import { Field, inputClass } from "@/components/Field";
import { Button, Modal } from "@/components/ui";
import { deleteBuilding, saveBuilding } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminBuilding } from "@/lib/admin/buildings";
import { BUILDING_STAGES, validateBuildingLead, type BuildingLead, type BuildingStage } from "@/lib/admin/validate";

export const STAGE_LABEL: Record<BuildingStage, string> = { lead: "ליד", contacted: "בקשר", joined: "הצטרף" };

type Form = Record<keyof BuildingLead, string>;

interface Props {
  token: string;
  /** null = closed; "new" = add a lead; a building = edit it. */
  editing: AdminBuilding | "new" | null;
  onClose: () => void;
  onSaved: (list: AdminBuilding[]) => void;
}

/** Popup to add a committee lead or edit a building (stage, contact person, apartments). */
export function BuildingForm({ token, editing, onClose, onSaved }: Props) {
  return (
    <Modal open={editing !== null} onClose={onClose} title={editing === "new" ? "בניין חדש בצנרת" : "עריכת בניין"}>
      {editing && <BuildingFields key={editing === "new" ? "new" : editing.id} token={token} building={editing === "new" ? null : editing} onSaved={onSaved} />}
    </Modal>
  );
}

/** The fields (remounted per building). */
function BuildingFields({ token, building: b, onSaved }: { token: string; building: AdminBuilding | null; onSaved: Props["onSaved"] }) {
  const [f, setF] = useState<Form>({
    name: b?.name ?? "", address: b?.address ?? "", city: b?.city ?? "פתח תקווה", committeeName: b?.committeeName ?? "",
    committeePhone: b?.committeePhone ?? "", apartmentCount: String(b?.apartmentCount || ""), pipeline: b?.pipeline ?? "lead", placeId: "",
  });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));

  /** Validates and saves. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateBuildingLead(f);
    if (!v.ok) return setErrors(v.errors as Partial<Form>);
    setPending(true);
    const res = await saveBuilding(token, { ...v.data, ...(b && { id: b.id }) });
    setPending(false);
    if (isApiError(res)) {
      setError(res.error);
      return setErrors((res.errors ?? {}) as Partial<Form>);
    }
    onSaved(res);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <Field label="שלב" error={errors.pipeline}>
        <select value={f.pipeline} onChange={set("pipeline")} className={inputClass}>
          {BUILDING_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
      </Field>
      {addressLookupOn ? (
        <AddressInput
          initialText={b ? `${b.address}, ${b.city}` : ""}
          error={errors.address ?? errors.city}
          onChange={(a) => setF((v) => ({ ...v, placeId: a?.placeId ?? "", address: a?.address ?? (b?.address ?? ""), city: a?.city ?? (b?.city ?? "") }))}
        />
      ) : (
      <div className="grid grid-cols-2 gap-3">
        <Field label="כתובת" error={errors.address}><input value={f.address} onChange={set("address")} className={inputClass} /></Field>
        <Field label="עיר" error={errors.city}><input value={f.city} onChange={set("city")} className={inputClass} /></Field>
      </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="שם הבניין (לא חובה)"><input value={f.name} onChange={set("name")} placeholder="בית רוטשילד" className={inputClass} /></Field>
        <Field label="מספר דירות" error={errors.apartmentCount}><input value={f.apartmentCount} onChange={set("apartmentCount")} inputMode="numeric" dir="ltr" className={inputClass} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="איש קשר בוועד"><input value={f.committeeName} onChange={set("committeeName")} className={inputClass} /></Field>
        <Field label="טלפון" error={errors.committeePhone}><input value={f.committeePhone} onChange={set("committeePhone")} inputMode="tel" dir="ltr" className={inputClass} /></Field>
      </div>
      <p className="text-sm text-muted">רק בניין בשלב „הצטרף” מקבל דיירים דרך קישור ההצטרפות.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "שומרים…" : "שמירה"}</Button>
      {b && <DeleteBuilding token={token} building={b} onDeleted={onSaved} onError={setError} />}
    </form>
  );
}

/** Delete with a confirm step. The server refuses buildings that already have redemptions. */
function DeleteBuilding({ token, building, onDeleted, onError }: {
  token: string; building: AdminBuilding; onDeleted: Props["onSaved"]; onError: (message: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    const res = await deleteBuilding(token, building.id);
    setPending(false);
    if (isApiError(res)) {
      setConfirming(false);
      return onError(res.error);
    }
    onDeleted(res);
  }

  if (!confirming) {
    return <Button variant="ghost" size="md" className="text-red-700" onClick={() => setConfirming(true)}>מחיקת הבניין</Button>;
  }
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-rose p-4">
      <p>
        למחוק את <strong>{building.name ?? building.address}</strong>? הבניין, הדירות וקישור ההצטרפות יימחקו, והדיירים ינותקו
        ממנו. אי אפשר לבטל את המחיקה.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" size="md" onClick={remove} disabled={pending}>{pending ? "מוחקים…" : "כן, למחוק"}</Button>
        <Button variant="secondary" size="md" onClick={() => setConfirming(false)} disabled={pending}>ביטול</Button>
      </div>
    </div>
  );
}
