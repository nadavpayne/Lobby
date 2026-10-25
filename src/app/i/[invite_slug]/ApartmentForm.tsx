"use client";

import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { primaryButton } from "@/components/ui";
import { joinBuildingRequest } from "@/lib/api/buildings";
import type { MemberStatus } from "@/lib/buildings/types";
import { validateResidentJoin, type ResidentJoinErrors } from "@/lib/buildings/validateResidentJoin";

interface Props {
  token: string;
  inviteSlug: string;
  address: string;
  apartmentCount: number;
  onJoined: (status: MemberStatus, apartmentNumber: string) => void;
}

/** Name + apartment number (1..count) for joining the building. */
export function ApartmentForm({ token, inviteSlug, address, apartmentCount, onJoined }: Props) {
  const [errors, setErrors] = useState<ResidentJoinErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const check = validateResidentJoin(payload, apartmentCount);
    if (!check.ok) return setErrors(check.errors);

    setErrors({});
    setFormError(null);
    setPending(true);
    const res = await joinBuildingRequest(token, { ...payload, inviteSlug });
    setPending(false);

    if ("status" in res) onJoined(res.status, String(check.data.apartmentNumber));
    else if ("errors" in res) setErrors(res.errors);
    else setFormError(res.error);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">באיזו דירה אתם גרים?</h1>
        <p className="text-lg">{address}</p>
      </div>
      <Field label="השם שלכם" error={errors.name}>
        <input name="name" autoComplete="name" maxLength={60} aria-invalid={!!errors.name} className={inputClass} />
      </Field>
      <Field label="מספר דירה" hint={`בין 1 ל-${apartmentCount}`} error={errors.apartmentNumber}>
        <input name="apartmentNumber" inputMode="numeric" dir="ltr" aria-invalid={!!errors.apartmentNumber} className={`${inputClass} max-w-32 text-center text-2xl`} />
      </Field>
      <p className="rounded-xl bg-navy/5 p-4">ההטבות הן לדירה: מימוש אחד בכל עסק בכל חודש. אפשר עד 2 חשבונות לכל דירה.</p>
      {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{formError}</p>}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "מצטרפים…" : "הצטרפות"}
      </button>
    </form>
  );
}
