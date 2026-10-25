"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { submitJoin } from "@/lib/api/join";
import { validateJoin, type JoinErrors, type JoinField } from "@/lib/businesses/validateJoin";
import { CategoryPicker } from "./CategoryPicker";
import { JoinSuccess } from "./JoinSuccess";

/** Business onboarding form: details, offer and PIN; on success shows the personal verification link. */
export function JoinForm() {
  const [errors, setErrors] = useState<JoinErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ loginUrl: string; email: string } | null>(null);

  /** Common props for a named control, including its error state. */
  const control = (name: JoinField) => ({ name, "aria-invalid": !!errors[name], className: inputClass });

  /** Highlights field errors and moves focus to the first invalid control. */
  function showErrors(form: HTMLFormElement, fieldErrors: JoinErrors) {
    setErrors(fieldErrors);
    requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      ...Object.fromEntries(data),
      subcategories: data.getAll("subcategories"),
      tags: data.getAll("tags"),
      discountPercent: Number(data.get("discountPercent")),
      acceptTerms: data.get("acceptTerms") === "on",
    };

    // Same rules as the server, so most mistakes are caught without a round-trip.
    const check = validateJoin(payload);
    if (!check.ok) return showErrors(form, check.errors);

    setErrors({});
    setPending(true);
    setFormError(null);
    const res = await submitJoin(payload);
    setPending(false);

    if ("loginUrl" in res) {
      setDone({ loginUrl: res.loginUrl, email: check.data.email });
      window.scrollTo(0, 0);
    } else if ("errors" in res) showErrors(form, res.errors);
    else setFormError(res.error);
  }

  if (done) return <JoinSuccess loginUrl={done.loginUrl} email={done.email} />;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">הצטרפות עסקים ללובי</h1>
        <p className="text-lg">לקוחות חדשים מהבניינים בשכונה. משלמים רק על מכירות שאימתתם.</p>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-bold">פרטי העסק</legend>
        <Field label="שם העסק" error={errors.name}>
          <input {...control("name")} autoComplete="organization" maxLength={80} />
        </Field>
        <CategoryPicker errors={errors} />
        <Field label="כתובת העסק" hint="רחוב ומספר" error={errors.address}>
          <input {...control("address")} autoComplete="street-address" maxLength={120} />
        </Field>
        <Field label="עיר" hint="דיירים יראו עסקים בעיר של הבניין שלהם" error={errors.city}>
          <input {...control("city")} autoComplete="address-level2" maxLength={40} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-bold">איש קשר</legend>
        <Field label="שם מלא" error={errors.contactName}>
          <input {...control("contactName")} autoComplete="name" maxLength={60} />
        </Field>
        <Field label="טלפון" error={errors.phone}>
          <input {...control("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" />
        </Field>
        <Field label="אימייל" error={errors.email}>
          <input {...control("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-bold">ההטבה לדיירים</legend>
        <Field label="אחוז הנחה" error={errors.discountPercent}>
          <input {...control("discountPercent")} type="number" inputMode="numeric" min={1} max={50} defaultValue={10} dir="ltr" />
        </Field>
        <Field label="תיאור ההטבה" error={errors.description}>
          <input {...control("description")} placeholder="לדוגמה: 10% הנחה על כל התפריט" maxLength={200} />
        </Field>
        <Field label="תנאים והגבלות (לא חובה)" error={errors.terms}>
          <textarea {...control("terms")} rows={3} placeholder="לדוגמה: לא כולל אלכוהול ומבצעים אחרים" maxLength={500} className={`${inputClass} py-2`} />
        </Field>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
        <p className="font-bold">תנאי ההצטרפות</p>
        <ul className="list-disc ps-5 leading-relaxed">
          <li>הנחה לדיירים לפי האחוז שבחרתם</li>
          <li>עמלה של <bdi dir="ltr">5%</bdi> ללובי על כל מימוש מאומת</li>
          <li>מימוש אחד לכל דירה בחודש קלנדרי</li>
          <li>אין עמלה על מימוש שלא אימתתם</li>
        </ul>
        <label className="flex min-h-11 items-center gap-3">
          <input name="acceptTerms" type="checkbox" aria-invalid={!!errors.acceptTerms} className="size-6 shrink-0 accent-navy" />
          <span>
            קראתי ואני מאשר/ת את{" "}
            <Link href="/business-terms" target="_blank" className="font-bold underline">תנאי ההצטרפות לעסקים</Link> ואת{" "}
            <Link href="/privacy" target="_blank" className="font-bold underline">מדיניות הפרטיות</Link>
          </span>
        </label>
        {errors.acceptTerms && <span role="alert" className="text-sm text-red-700">{errors.acceptTerms}</span>}
      </div>

      {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{formError}</p>}

      <button type="submit" disabled={pending} className="min-h-14 rounded-xl bg-amber text-xl font-bold text-navy disabled:opacity-60">
        {pending ? "שולחים…" : "הצטרפות ללובי"}
      </button>
    </form>
  );
}
