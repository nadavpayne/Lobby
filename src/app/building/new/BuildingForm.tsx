"use client";

import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { primaryButton } from "@/components/ui";
import { registerBuilding } from "@/lib/api/buildings";
import type { MyBuilding } from "@/lib/buildings/types";
import { validateBuilding, type BuildingErrors, type BuildingField } from "@/lib/buildings/validateBuilding";

/** Building registration: address, city, apartment count, and the committee member's own name and apartment. */
export function BuildingForm({ token, onCreated }: { token: string; onCreated: (building: MyBuilding) => void }) {
  const [errors, setErrors] = useState<BuildingErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Common props for a named control, including its error state. */
  const control = (name: BuildingField) => ({ name, "aria-invalid": !!errors[name], className: inputClass });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const check = validateBuilding(payload);
    if (!check.ok) return setErrors(check.errors);

    setErrors({});
    setFormError(null);
    setPending(true);
    const res = await registerBuilding(token, payload);
    setPending(false);

    if ("inviteUrl" in res) {
      const d = check.data;
      onCreated({ role: "committee", status: "active", apartmentNumber: String(d.apartmentNumber), address: d.address, city: d.city, apartmentCount: d.apartmentCount, inviteUrl: res.inviteUrl });
    } else if ("errors" in res) setErrors(res.errors);
    else setFormError(res.error);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">פרטי הבניין</h1>
        <p className="text-lg">אחרי הרישום תקבלו קישור הצטרפות לשלוח בקבוצת הווטסאפ של הבניין.</p>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-bold">הבניין</legend>
        <Field label="רחוב ומספר בית" error={errors.address}>
          <input {...control("address")} autoComplete="street-address" maxLength={120} />
        </Field>
        <Field label="עיר" error={errors.city}>
          <input {...control("city")} autoComplete="address-level2" maxLength={40} />
        </Field>
        <Field label="כמה דירות יש בבניין?" hint="הדיירים יבחרו מספר דירה מ-1 ועד המספר הזה" error={errors.apartmentCount}>
          <input {...control("apartmentCount")} inputMode="numeric" dir="ltr" className={`${inputClass} max-w-32`} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-bold">חבר הוועד</legend>
        <Field label="השם שלך" error={errors.name}>
          <input {...control("name")} autoComplete="name" maxLength={60} />
        </Field>
        <Field label="מספר הדירה שלך" error={errors.apartmentNumber}>
          <input {...control("apartmentNumber")} inputMode="numeric" dir="ltr" className={`${inputClass} max-w-32`} />
        </Field>
      </fieldset>

      {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{formError}</p>}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "רושמים…" : "רישום הבניין"}
      </button>
    </form>
  );
}
